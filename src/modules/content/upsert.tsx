import useLogger from '@asuna-stack/asuna-sdk/dist/next/hooks/logger';

import * as _ from 'lodash';
import moment from 'moment';
import * as R from 'ramda';
import * as React from 'react';
import { useEffect } from 'react';
import { PropagateLoader } from 'react-spinners';
import useEffectOnce from 'react-use/lib/useEffectOnce';
import useSetState from 'react-use/lib/useSetState';
import { useStateWithHistory } from 'react-use/lib/useStateWithHistory';

import { Func } from '../../adapters/func';
import { DynamicForm, DynamicFormProps } from '../../components/DynamicForm';
import { DynamicFormTypes } from '../../components/DynamicForm/types';
import { AppContext } from '../../core/context';
import { EventBus, EventType } from '../../core/events';
import { DebugInfo } from '../../helpers/debug';
import { isErrorResponse, toFormErrors } from '../../helpers/error';
import { TenantHelper } from '../../helpers/tenant';
import { TenantContext } from '../../helpers/tenant-context';
import { diff } from '../../helpers/utils';
import { createLogger } from '../../logger';
import * as schemaHelper from '../../schema';

import type { Pane } from '../../components/Panes';

// const logger = createLogger('modules:content:upsert');
const logger = createLogger('<[ContentUpsert]>');

// --------------------------------------------------------------
// Build Form
// --------------------------------------------------------------

interface IContentForm extends Pick<DynamicFormProps, 'onSubmit'> {
  // form;
  fields;
  onChange: (value) => void;
}

const ContentForm: React.FC<IContentForm & DynamicFormProps> = ({ fields, ...props }) => {
  const mappedFields = R.map((field) => {
    // DatePicker for antd using moment instance
    const isDate = R.includes(field.type)([DynamicFormTypes.Date, DynamicFormTypes.DateTime]);
    return field.value && isDate ? { name: field.name, value: moment(field.value) } : field;
  }, fields);

  useLogger('<[ContentForm]>', props, { fields, mappedFields });

  return <DynamicForm fields={mappedFields} {...props} />;
};

/*
const ContentForm2 = Form.create<IContentForm & DynamicFormProps>({
  mapPropsToFields({ fields }) {
    const mappedFields = R.map<any, any>((field) => {
      // DatePicker for antd using moment instance
      const isDate = R.includes(field.type)([DynamicFormTypes.Date, DynamicFormTypes.DateTime]);
      if (field.value && isDate) {
        return Form.createFormField({ ...field, value: moment(field.value) });
      }
      return Form.createFormField({ ...field });
    })(fields);
    logger.debug('[ContentForm][mapPropsToFields]', { fields, mappedFields });
    return mappedFields;
  },
  onFieldsChange(props, changedFields) {
    logger.debug('[ContentForm][onFieldsChange]', { props, changedFields });
    const filteredChangedFields = R.compose(
      R.pickBy((field, key) => {
        const oldVar = R.path(['fields', key, 'value'])(props);
        const newVar = field.value;
        logger.debug('[ContentForm][onFieldsChange]', { oldVar, newVar, field, key, changedFields });

        return oldVar !== newVar || field.errors != null;
      }),
      R.map<any, any>((field) => {
        let { value } = field;
        if (value && value._isAMomentObject) {
          value = value.toDate();
        }
        return { ...field, value };
      }),
      // remove fields when validating=true
      R.filter<any>((field) => !R.prop('validating', field)),
    )(changedFields);
    logger.debug('[ContentForm][onFieldsChange]', { filteredChangedFields });
    if (!R.isEmpty(filteredChangedFields)) props.onChange(filteredChangedFields);
  },
})(DynamicForm);
*/

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

export interface IProps extends ReduxProps {
  basis: { pane: Pane };
  // schemas: Asuna.Schema.ModelSchemas;
  models: object;
  onClose: () => void;
}

interface IState {
  status: 'Initializing' | 'Loading' | 'Loaded' | 'Updating' | 'Done';
  isInsertMode: boolean;
  modelName: string;
  primaryKey: string;
  /**
   * 是否是第一次初始化操作
   */
  init: boolean;
  loadings: { INIT: boolean; LOAD: boolean; ASSOCIATIONS: boolean };
  fields: FormField[];
  key: string;
  hasErrors: boolean;
  /**
   * 备份的原始数据记录
   */
  originalFieldValues?;
  wrappedFormSchema?;
}

const preDecorators: (tag: string) => R.AtLeastOneFunctionsFlow<any, any> = (tag) => [
  schemaHelper.peek(`before-${tag}`),
  schemaHelper.hiddenComponentDecorator,
  schemaHelper.jsonDecorator,
  schemaHelper.enumDecorator,
  schemaHelper.dynamicTypeDecorator,
  schemaHelper.peek(`after-${tag}`),
];

const asyncDecorators: (tag: string) => R.AtLeastOneFunctionsFlow<any, any> = (tag) => [
  // TODO 目前异步数据拉取无法在页面上显示对应字段的 loading 状态
  async (fields) => R.curry(schemaHelper.peek(`before-async-${tag}`))(fields),
  // async fields => schemaHelper.hiddenComponentDecorator(fields),
  schemaHelper.asyncLoadAssociationsDecorator,
  schemaHelper.associationDecorator,
  async (fields) => R.curry(schemaHelper.peek(`after-async-${tag}`))(fields),
];

export const ContentUpsert: React.FC<IProps> = ({ models, onClose, basis }) => {
  // content::create::name::timestamp => name
  const modelName = R.compose(R.nth(2) as any, R.split(/::/), R.path(['pane', 'key']))(basis) as string;
  logger.log('model name is ', modelName);

  const isInsertMode = !R.path(['pane', 'data', 'record'])(basis);
  const primaryKey = AppContext.adapters.models.getPrimaryKey(modelName);

  const [fields, setFields, stateHistory] = useStateWithHistory([] as IState['fields']);
  const [state, setState] = useSetState<
    Omit<IState, 'fields' | 'loadings' | 'primaryKey' | 'isInsertMode' | 'modelName'>
  >({
    status: 'Initializing',
    init: true,
    key: basis.pane.key,
    hasErrors: false,
  });
  /*
   * Insert: Init Schema
   * Update: Init Schema -> Load Data -> Load associations
   */
  const [loadings, setLoadings] = useSetState<{ INIT: boolean; LOAD: boolean; ASSOCIATIONS: boolean }>({
    INIT: true,
    LOAD: !isInsertMode,
    ASSOCIATIONS: true,
  });

  const _reloadEntity = async (record): Promise<any> => {
    if (record) {
      logger.withTag('[_reloadEntity]').log('[_reloadEntity]', 'reload model...', record);
      return await Func.fetch(modelName, { id: record[primaryKey], profile: 'ids' });
    }
  };

  const _handleFormChange = async (changedFields) => {
    const scope = { logger: logger.withTag('[handleFormChange]') };
    scope.logger.log({ changedFields, state, fields });
    if (!R.isEmpty(changedFields)) {
      const currentChangedFields = R.map<any, any>(R.pick(['value', 'errors']))(changedFields);
      const changedFieldsBefore = R.mergeDeepRight(state.wrappedFormSchema as any, fields);
      const allChangedFields = R.mergeDeepRight(changedFieldsBefore, currentChangedFields);
      // 这里只装饰变化的 fields
      const { fields: decoratedFields } = (R.pipe as any)(...preDecorators('LOAD'))({
        modelName,
        fields: allChangedFields,
      });

      const stateDiff = diff(fields, decoratedFields);
      scope.logger.debug({
        fields,
        decoratedFields,
        stateDiff,
        currentChangedFields,
        changedFieldsBefore,
        allChangedFields,
      });

      const updateModeAtTheFirstTime = !isInsertMode && state.init;

      const hasEnumFilter = !R.isEmpty(R.filter(R.propEq('type', DynamicFormTypes.EnumFilter), changedFields));
      const hasSelectable = !R.isEmpty(R.filter(R.path<any>(['options', 'selectable']), changedFields));

      scope.logger.debug({
        changedFields,
        updateModeAtTheFirstTime,
        hasEnumFilter,
        hasSelectable,
        options: R.map(R.path(['options']), changedFields),
      });

      if (updateModeAtTheFirstTime || hasEnumFilter || hasSelectable) {
        setState({ status: 'Updating' });
        setLoadings({ ASSOCIATIONS: true });
        scope.logger.debug('load async decorated fields', { ...decoratedFields });
        const { fields: asyncDecoratedFields } = await R.pipeWith(
          (f, res) => res.then(f),
          asyncDecorators('ASSOCIATIONS'),
        )({ modelName, fields: decoratedFields });
        const isDifferent = diff(asyncDecoratedFields, fields).isDifferent;
        if (isDifferent) {
          scope.logger.debug({ asyncDecoratedFields, decoratedFields, fields });
        }
        setState({ status: 'Done', init: false });
        setFields(asyncDecoratedFields);
      } else {
        setState({ status: 'Done' });
        setFields(decoratedFields);
      }
      setLoadings({ LOAD: false, ASSOCIATIONS: false });
    }
  };

  const _handleFormSubmit = async (values) => {
    /*
    const fieldPairs: any = R.compose(
      R.pickBy((value, key) =>
        originalFieldValues
          ? !_.isEqual(value, originalFieldValues[key]) ||
            // fixme SimpleJSON 类型目前 newVar 和 oldVar 一样，暂时没找到原因
            (this.state.fields[key] as any).type === 'SimpleJSON'
          : true,
      ),
      R.map<any, any>(R.prop('value')),
    )(this.state.fields);
*/
    logger.debug('[handleFormSubmit]', { values, originalFieldValues: state.originalFieldValues, fields });

    const id: any = R.prop(primaryKey)(state.originalFieldValues as any);

    const data = Func.upsert(modelName, { body: { ...values, [primaryKey]: id } }).catch((error) => {
      if (isErrorResponse(error)) {
        const errors = toFormErrors(error.response);
        logger.warn('[upsert callback]', { error, errors });
        // if (typeof errors === 'string') {
        //   message.error(toErrorMessage(errors));
        // } else {
        // }
        _handleFormChange(errors);
        setState({ hasErrors: true });
      }
    });
    setState({
      hasErrors: false,
      originalFieldValues: { ...state.originalFieldValues, ...values },
    });
    // FIXME 当前页面暂未切换为 update 模式，临时关闭当前页面
    if (isInsertMode) {
      EventBus.sendEvent(EventType.MODEL_INSERT, { modelName });
      onClose();
    } else {
      EventBus.sendEvent(EventType.MODEL_UPDATE, { modelName, id });
    }
  };

  useEffectOnce(() => {
    const scope = { logger: logger.withTag('[useEffectOnce]') };
    (async () => {
      // logger.log('[componentWillMount]', { props: this.props, state: this.state });
      // const { basis } = this.props;
      scope.logger.log('init...');

      // content::create::name::timestamp => name
      const modelName = R.compose(R.nth(2) as any, R.split(/::/), R.path(['pane', 'key']))(basis) as string;
      scope.logger.debug('model name is ', modelName);

      // --------------------------------------------------------------
      // Build form fields with all needed data
      // --------------------------------------------------------------

      const formSchema = AppContext.adapters.models.getFormSchema(modelName);

      // if (modelName === 'colleges') {
      //   formSchema = R.pick(['id', 'name', 'name_en', 'sequences'], formSchema);
      // }

      const formFields = R.omit(['created_at', 'updated_at'])(formSchema);
      scope.logger.debug('form fields is', formFields);

      // --------------------------------------------------------------
      // Using pre decorators instead
      // --------------------------------------------------------------

      let { fields: decoratedFields } = (R.pipe as any)(...preDecorators('INIT'))({
        modelName,
        fields: formFields,
      });

      scope.logger.debug('decoratedFields is', decoratedFields);

      let originalFieldValues;

      // INSERT-MODE: 仅在新增模式下拉取关联数据
      if (isInsertMode) {
        ({ fields: decoratedFields } = await R.pipeWith(
          (f, res) => res.then(f),
          asyncDecorators('ASSOCIATIONS'),
        )({ modelName, fields: decoratedFields }));
        // insert mode 隐藏 tenant 字段
        _.set(decoratedFields['tenant'], 'options.accessible', 'hidden');
      } else {
        // 编辑模式尝试再次拉取数据 !!IMPORTANT!! record must have property id
        const record = basis?.pane?.data?.record;
        const entity = await _reloadEntity(record);
        // const models = this.props.models;
        originalFieldValues = R.pathOr(entity, [modelName, record?.id])(models);
        scope.logger.debug(
          { modelName, record, entity },
          { originalFieldValues, record },
          diff(originalFieldValues, record),
        );
      }

      // 当前角色是租户的资源不显示租户字段
      if (TenantContext.hasTenantRoles) {
        _.set(decoratedFields['tenant'], 'options.accessible', 'hidden');
      }

      setState({
        // 不是新增时还存在更多信息的加载操作
        status: isInsertMode ? 'Done' : 'Loading',
        // 包括了表单的元数据，当前页面也只需要填充这一次
        wrappedFormSchema: formFields,
        originalFieldValues,
      });
      // 填充整个页面需要的数据，这是页面初始化后第一次数据完整数据填充，并且已经包括了关联数据，但是并未包含真实的值
      setFields(decoratedFields);
      // 更新当前的加载状态，这里可以结束初始化和关联阶段
      setLoadings({ INIT: false, ASSOCIATIONS: false });
      scope.logger.success('init done', state, loadings);
    })();
  });

  /*
   * update 模式时第一次加载数据需要通过异步获取到的数据进行渲染。
   * 渲染成功后则不再处理 props 的数据更新，以保证当前用户的修改不会丢失。
   */
  useEffect(() => {
    if (state.init && state.originalFieldValues && fields) {
      logger.info('trigger updates', state, fields);
      _handleFormChange(R.map((value) => ({ value }))(state.originalFieldValues)).catch(logger.error);
    }
  }, [state.originalFieldValues, fields]);

  TenantHelper.wrapFields(modelName, fields);
  const isPublishedField = _.find(fields, (field) => field.name === 'isPublished') as any;
  const auditMode = !TenantContext.enableModelPublishForCurrentUser(modelName) && !isPublishedField?.value;

  // loading 仅在初次加载时渲染，否则编辑器会 lose focus
  const noFields = R.anyPass([R.isEmpty, R.isNil])(fields);

  useLogger('<[ContentUpsert]>', state, loadings, fields, { noFields }, stateHistory.history);

  if (noFields || loadings.INIT || loadings.LOAD) {
    return (
      <React.Fragment>
        <span>{state.status}...</span>
        <div>
          <PropagateLoader color="#13c2c2" />
        </div>
        {/* language=CSS */}
        <style jsx>{`
          div {
            width: 0;
            margin: 10rem auto;
          }
        `}</style>
      </React.Fragment>
    );
  }

  return (
    <>
      <ContentForm
        model={modelName}
        anchor
        auditMode={auditMode}
        fields={fields}
        onChange={_handleFormChange}
        onSubmit={_handleFormSubmit}
        onClose={onClose}
      />
      <DebugInfo data={{ basis, state, auditMode }} divider />
    </>
  );
};

class ContentUpsert2 extends React.Component<IProps, IState> {
  preDecorators = (tag) => [
    schemaHelper.peek(`before-${tag}`),
    schemaHelper.hiddenComponentDecorator,
    schemaHelper.jsonDecorator,
    schemaHelper.enumDecorator,
    schemaHelper.dynamicTypeDecorator,
    schemaHelper.peek(`after-${tag}`),
  ];

  asyncDecorators = (tag) => [
    // TODO 目前异步数据拉取无法在页面上显示对应字段的 loading 状态
    async (fields) => R.curry(schemaHelper.peek(`before-async-${tag}`))(fields),
    // async fields => schemaHelper.hiddenComponentDecorator(fields),
    schemaHelper.asyncLoadAssociationsDecorator,
    schemaHelper.associationDecorator,
    async (fields) => R.curry(schemaHelper.peek(`after-async-${tag}`))(fields),
  ];

  constructor(props) {
    super(props);

    const { basis } = this.props;

    // content::create::name::timestamp => name
    const modelName = R.compose(R.nth(2) as any, R.split(/::/), R.path(['pane', 'key']))(basis) as string;
    logger.log('[constructor]', 'model name is ', modelName);

    const isInsertMode = !R.path(['pane', 'data', 'record'])(basis);
    const primaryKey = AppContext.adapters.models.getPrimaryKey(modelName);

    this.state = {
      status: 'Initializing',
      primaryKey,
      isInsertMode,
      modelName,
      init: true,
      /**
       * Insert: Init Schema
       * Update: Init Schema -> Load Data -> Load associations
       */
      loadings: { INIT: true, LOAD: !isInsertMode, ASSOCIATIONS: true },
      fields: [],
      key: basis.pane.key,
      hasErrors: false,
    };
  }

  async componentWillMount() {
    logger.log('[componentWillMount]', { props: this.props, state: this.state });
    const { basis } = this.props;
    const { isInsertMode, init, primaryKey } = this.state;

    // content::create::name::timestamp => name
    const modelName = R.compose(R.nth(2) as any, R.split(/::/), R.path(['pane', 'key']))(basis) as string;
    logger.debug('[componentWillMount]', 'model name is ', modelName);

    // --------------------------------------------------------------
    // Build form fields with all needed data
    // --------------------------------------------------------------

    const formSchema = AppContext.adapters.models.getFormSchema(modelName);

    // if (modelName === 'colleges') {
    //   formSchema = R.pick(['id', 'name', 'name_en', 'sequences'], formSchema);
    // }

    const formFields = R.omit(['created_at', 'updated_at'])(formSchema);
    logger.debug('[componentWillMount]', 'form fields is', formFields);

    // --------------------------------------------------------------
    // Using pre decorators instead
    // --------------------------------------------------------------

    let { fields: decoratedFields } = (R.pipe as any)(...this.preDecorators('INIT'))({ modelName, fields: formFields });
    let originalFieldValues;

    // INSERT-MODE: 仅在新增模式下拉取关联数据
    if (isInsertMode) {
      ({ fields: decoratedFields } = await R.pipeWith(
        (f, res) => res.then(f),
        asyncDecorators('ASSOCIATIONS'),
      )({ modelName, fields: decoratedFields }));
      // insert mode 隐藏 tenant 字段
      _.set(decoratedFields['tenant'], 'options.accessible', 'hidden');
    } else {
      // 非新增模式尝试再次拉取数据 TODO record must have property id
      const record = this.props?.basis?.pane?.data?.record;
      const entity = await this._reloadEntity(record);
      const models = this.props.models;
      originalFieldValues = R.pathOr(entity, [modelName, record?.id])(models);
      logger.debug('[componentWillMount]', { modelName, record, entity }, diff(originalFieldValues, record));
    }

    // 当前角色是租户的资源不显示租户字段
    if (TenantContext.hasTenantRoles) {
      _.set(decoratedFields['tenant'], 'options.accessible', 'hidden');
    }

    await this.setState({
      // 不是新增时还存在更多信息的加载操作
      status: this.state.isInsertMode ? 'Done' : 'Loading',
      // 填充整个页面需要的数据，这是页面初始化后第一次数据完整数据填充，并且已经包括了关联数据，但是并未包含真实的值
      fields: decoratedFields,
      // 包括了表单的元数据，当前页面也只需要填充这一次
      wrappedFormSchema: formFields,
      // 更新当前的加载状态，这里可以结束初始化和关联阶段
      loadings: { INIT: false, LOAD: this.state.loadings.LOAD, ASSOCIATIONS: false },
      originalFieldValues,
    });

    /*
     * update 模式时第一次加载数据需要通过异步获取到的数据进行渲染。
     * 渲染成功后则不再处理 props 的数据更新，以保证当前用户的修改不会丢失。
     */
    if (originalFieldValues && init) {
      logger.debug('[componentWillMount]', 'field values is', originalFieldValues);
      await this._handleFormChange(R.map((value) => ({ value }))(originalFieldValues));
    }
  }

  /**
   * 当且仅当在 state.fields 发生变化时重新渲染页面
   * @param nextProps
   * @param nextState
   * @param nextContext
   * @returns {boolean|*}
   */
  shouldComponentUpdate(nextProps, nextState, nextContext): boolean | any {
    const { key } = this.state;
    const { activeKey } = nextProps;
    const propsDiff = { isDifferent: false };
    // const propsDiff = diff(this.props, nextProps);
    const stateDiff = diff(this.state, nextState, { include: ['fields', 'loadings'] });
    const samePane = key === activeKey;
    const shouldUpdate = samePane && (propsDiff.isDifferent || stateDiff.isDifferent || this.state.hasErrors);
    logger.log(
      '[shouldComponentUpdate]',
      { nextProps, nextState, nextContext },
      { shouldUpdate, samePane, propsDiff, stateDiff, hasErrors: this.state.hasErrors },
    );
    return shouldUpdate;
  }

  _reloadEntity = async (record): Promise<any> => {
    const { modelName, primaryKey } = this.state;
    if (record) {
      logger.log('[_reloadEntity]', 'reload model...', record);
      return await Func.fetch(modelName, { id: record[primaryKey], profile: 'ids' });
    }
  };

  /**
   * Saving changed field values in props
   * @param changedFields
   */
  _handleFormChange = async (changedFields) => {
    const { isInsertMode, init, modelName } = this.state;
    logger.log('[handleFormChange]', { changedFields, state: this.state });
    if (!R.isEmpty(changedFields)) {
      const { wrappedFormSchema, fields } = this.state;

      const currentChangedFields = R.map<any, any>(R.pick(['value', 'errors']))(changedFields);
      const changedFieldsBefore = R.mergeDeepRight(wrappedFormSchema as any, fields);
      const allChangedFields = R.mergeDeepRight(changedFieldsBefore, currentChangedFields);
      // 这里只装饰变化的 fields
      const { fields: decoratedFields } = (R.pipe as any)(...this.preDecorators('LOAD'))({
        modelName,
        fields: allChangedFields,
      });

      const stateDiff = diff(this.state, { fields: decoratedFields }, { include: ['fields'] });
      logger.debug('[handleFormChange]', {
        fields,
        decoratedFields,
        stateDiff,
        currentChangedFields,
        changedFieldsBefore,
        allChangedFields,
      });

      const updateModeAtTheFirstTime = !isInsertMode && init;

      const hasEnumFilter = !R.isEmpty(R.filter(R.propEq('type', DynamicFormTypes.EnumFilter), changedFields));
      const hasSelectable = !R.isEmpty(R.filter(R.path<any>(['options', 'selectable']), changedFields));

      logger.debug('[handleFormChange]', {
        changedFields,
        updateModeAtTheFirstTime,
        hasEnumFilter,
        hasSelectable,
        options: R.map(R.path(['options']), changedFields),
      });

      if (updateModeAtTheFirstTime || hasEnumFilter || hasSelectable) {
        this.setState({
          status: 'Updating',
          loadings: { ...this.state.loadings, ASSOCIATIONS: true },
        });
        logger.debug('[handleFormChange]', 'load async decorated fields');
        const { fields: asyncDecoratedFields } = await R.pipeWith(
          (f, res) => res.then(f),
          asyncDecorators('ASSOCIATIONS'),
        )({ modelName, fields: decoratedFields });
        const isDifferent = diff(asyncDecoratedFields, this.state.fields).isDifferent;
        if (isDifferent) {
          logger.debug('[handleFormChange]', {
            asyncDecoratedFields,
            decoratedFields,
            state: this.state.fields,
          });
        }
        this.setState({
          status: 'Done',
          init: false,
          loadings: { ...this.state.loadings, LOAD: false, ASSOCIATIONS: false },
          fields: asyncDecoratedFields,
        });
      } else {
        this.setState({
          status: 'Done',
          fields: decoratedFields,
          loadings: { ...this.state.loadings, LOAD: false, ASSOCIATIONS: false },
        });
      }
    }
  };

  _handleFormSubmit = async (values) => {
    const { originalFieldValues, primaryKey } = this.state;

    /*
    const fieldPairs: any = R.compose(
      R.pickBy((value, key) =>
        originalFieldValues
          ? !_.isEqual(value, originalFieldValues[key]) ||
            // fixme SimpleJSON 类型目前 newVar 和 oldVar 一样，暂时没找到原因
            (this.state.fields[key] as any).type === 'SimpleJSON'
          : true,
      ),
      R.map<any, any>(R.prop('value')),
    )(this.state.fields);
*/
    logger.debug('[handleFormSubmit]', { values, originalFieldValues, fields: this.state.fields });

    const { onClose } = this.props;
    const { modelName, isInsertMode } = this.state;

    const id: any = R.prop(primaryKey)(originalFieldValues as any);

    const data = Func.upsert(modelName, { body: { ...values, [primaryKey]: id } }).catch((error) => {
      if (isErrorResponse(error)) {
        const errors = toFormErrors(error.response);
        logger.warn('[upsert callback]', { error, errors });
        // if (typeof errors === 'string') {
        //   message.error(toErrorMessage(errors));
        // } else {
        // }
        this._handleFormChange(errors);
        this.setState({ hasErrors: true });
      }
    });
    this.setState({
      hasErrors: false,
      originalFieldValues: { ...originalFieldValues, ...values },
    });
    // FIXME 当前页面暂未切换为 update 模式，临时关闭当前页面
    if (isInsertMode) {
      EventBus.sendEvent(EventType.MODEL_INSERT, { modelName });
      onClose();
    } else {
      EventBus.sendEvent(EventType.MODEL_UPDATE, { modelName, id });
    }
  };

  render() {
    const { fields, loadings, status, modelName } = this.state;
    TenantHelper.wrapFields(modelName, fields);
    const isPublishedField = _.find(fields, (field) => field.name === 'isPublished') as any;
    const auditMode = !TenantContext.enableModelPublishForCurrentUser(modelName) && !isPublishedField?.value;

    logger.log('[render]', { props: this.props, state: this.state });

    // loading 仅在初次加载时渲染，否则编辑器会 lose focus
    const noFields = R.anyPass([R.isEmpty, R.isNil])(fields);
    logger.log('[render]', { noFields }, loadings);
    if (noFields || loadings.INIT || loadings.LOAD) {
      return (
        <React.Fragment>
          <span>{status}...</span>
          <div>
            <PropagateLoader color="#13c2c2" />
          </div>
          {/* language=CSS */}
          <style jsx>{`
            div {
              width: 0;
              margin: 10rem auto;
            }
          `}</style>
        </React.Fragment>
      );
    }

    return (
      <>
        <ContentForm
          model={modelName}
          anchor
          auditMode={auditMode}
          fields={fields}
          onChange={this._handleFormChange}
          onSubmit={this._handleFormSubmit}
          onClose={this.props.onClose}
        />
        <DebugInfo data={{ props: this.props, state: this.state, auditMode }} divider />
      </>
    );
  }
}

// const mapStateToProps = (state: RootState) => R.pick(['models'])(state.models);

export default ContentUpsert;
