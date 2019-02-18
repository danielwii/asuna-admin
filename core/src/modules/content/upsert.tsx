import React from 'react';
import { connect } from 'react-redux';
import * as R from 'ramda';
import moment from 'moment';

import { Form, message } from 'antd';
import { PropagateLoader } from 'react-spinners';

import { DynamicForm, DynamicFormTypes } from '@asuna-admin/components/DynamicForm';
import * as schemaHelper from '@asuna-admin/schema';
import { Pane } from '@asuna-admin/components';
import { modelsActions, RootState } from '@asuna-admin/store';
import {
  diff,
  isErrorResponse,
  reduxActionCallbackPromise,
  toErrorMessage,
  toFormErrors,
} from '@asuna-admin/helpers';
import { AppContext, EventBus, EventType } from '@asuna-admin/core';
import { createLogger } from '@asuna-admin/logger';
import idx from 'idx';
import { AxiosResponse } from 'axios';

const logger = createLogger('modules:content:upsert');

// --------------------------------------------------------------
// Build Form
// --------------------------------------------------------------

interface IContentForm {
  fields;
  onChange: (value) => void;
  onSubmit: (fn: (e: Error) => void) => void;
}

const ContentForm = Form.create<IContentForm>({
  mapPropsToFields({ fields }) {
    const mappedFields = R.map(field => {
      // DatePicker for antd using moment instance
      const isDate = R.contains(field.type)([DynamicFormTypes.Date, DynamicFormTypes.DateTime]);
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
        logger.debug('[ContentForm][onFieldsChange]', {
          oldVar,
          newVar,
          field,
          key,
          changedFields,
        });
        return oldVar !== newVar || field.errors != null;
      }),
      R.map(field => {
        let { value } = field;
        if (value && value._isAMomentObject) {
          value = value.toDate();
        }
        return { ...field, value };
      }),
      // remove fields when validating=true
      R.filter(field => !R.prop('validating', field)),
    )(changedFields);
    if (!R.isEmpty(filteredChangedFields)) {
      logger.debug('[ContentForm][onFieldsChange]', { filteredChangedFields });
      props.onChange(filteredChangedFields);
    }
  },
})(DynamicForm);

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

interface IProps extends ReduxProps {
  basis: { pane: Pane };
  // schemas: Asuna.Schema.ModelSchemas;
  models: object;
  onClose: () => void;
}

interface IState {
  status: 'Initializing' | 'Loading' | 'Loaded' | 'Updating' | 'Done';
  isInsertMode: boolean;
  modelName: string;
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
  originalFieldValues?: object;
  wrappedFormSchema?: object;
}

class ContentUpsert extends React.Component<IProps, IState> {
  preDecorators = tag => [
    schemaHelper.peek(`before-${tag}`),
    schemaHelper.hiddenComponentDecorator,
    schemaHelper.jsonDecorator,
    schemaHelper.enumDecorator,
    schemaHelper.peek(`after-${tag}`),
  ];

  asyncDecorators = tag => [
    // TODO 目前异步数据拉取无法在页面上显示对应字段的 loading 状态
    async fields => R.curry(schemaHelper.peek(`before-async-${tag}`))(fields),
    // async fields => schemaHelper.hiddenComponentDecorator(fields),
    schemaHelper.asyncLoadAssociationsDecorator,
    schemaHelper.associationDecorator,
    async fields => R.curry(schemaHelper.peek(`after-async-${tag}`))(fields),
  ];

  constructor(props) {
    super(props);

    const { basis } = this.props;

    // content::create::name::timestamp => name
    const modelName = R.compose(
      R.nth(2),
      R.split(/::/),
      R.path(['pane', 'key']),
    )(basis);
    logger.log('[constructor]', 'model name is ', modelName);

    const isInsertMode = !R.path(['pane', 'data', 'record'])(basis);

    this.state = {
      status: 'Initializing',
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
    const { isInsertMode, init } = this.state;

    // content::create::name::timestamp => name
    const modelName = R.compose(
      R.nth(2),
      R.split(/::/),
      R.path(['pane', 'key']),
    )(basis);
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

    let decoratedFields = R.pipe(...this.preDecorators('INIT'))(formFields);
    let originalFieldValues;

    // INSERT-MODE: 仅在新增模式下拉取关联数据
    if (isInsertMode) {
      decoratedFields = await R.pipeP(...this.asyncDecorators('ASSOCIATIONS'))(decoratedFields);
    } else {
      // 非新增模式尝试再次拉取数据 TODO record must have property id
      const record = idx(this.props, _ => _.basis.pane.data.record) as any;
      const { data: entity } = await this._reloadEntity(record);
      const models = this.props.models;
      originalFieldValues = R.pathOr(entity, [modelName, record.id])(models);
      logger.debug(
        '[componentWillMount]',
        { modelName, record, entity },
        diff(originalFieldValues, record),
      );
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
      await this._handleFormChange(R.map(value => ({ value }))(originalFieldValues));
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
    const shouldUpdate =
      samePane && (propsDiff.isDifferent || stateDiff.isDifferent || this.state.hasErrors);
    logger.log(
      '[shouldComponentUpdate]',
      { nextProps, nextState, nextContext },
      { shouldUpdate, samePane, propsDiff, stateDiff, hasErrors: this.state.hasErrors },
    );
    return shouldUpdate;
  }

  _reloadEntity = (record): Promise<AxiosResponse> => {
    const { dispatch } = this.props;
    const { modelName } = this.state;

    return reduxActionCallbackPromise(callback => {
      if (record) {
        logger.log('[_reloadEntity]', 'reload model...', record);
        dispatch(modelsActions.fetch(modelName, { id: record.id, profile: 'ids' }, callback));
      }
    });
  };

  /**
   * Saving changed field values in props
   * @param changedFields
   */
  _handleFormChange = async changedFields => {
    const { isInsertMode, init } = this.state;
    logger.log('[handleFormChange]', { changedFields, state: this.state });
    if (!R.isEmpty(changedFields)) {
      const { wrappedFormSchema, fields } = this.state;

      const currentChangedFields = R.map(R.pick(['value', 'errors']))(changedFields);
      const changedFieldsBefore = R.mergeDeepRight(wrappedFormSchema, fields);
      const allChangedFields = R.mergeDeepRight(changedFieldsBefore, currentChangedFields);
      // 这里只装饰变化的 fields
      const decoratedFields = R.pipe(...this.preDecorators('LOAD'))(allChangedFields);

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

      const hasEnumFilter = !R.isEmpty(
        R.filter(R.propEq('type', DynamicFormTypes.EnumFilter), changedFields),
      );
      const hasSelectable = !R.isEmpty(R.filter(R.path(['options', 'selectable']), changedFields));

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
        const asyncDecoratedFields = await R.pipeP(...this.asyncDecorators('ASSOCIATIONS'))(
          decoratedFields,
        );
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

  _handleFormSubmit = event => {
    logger.log('[handleFormSubmit]', event);
    event.preventDefault();
    const { originalFieldValues } = this.state;

    const fieldPairs = R.compose(
      R.pickBy((value, key) => (originalFieldValues ? value !== originalFieldValues[key] : true)),
      R.map(R.prop('value')),
    )(this.state.fields);
    logger.debug('[handleFormSubmit]', { fieldPairs });

    const id = R.prop('id')(originalFieldValues);

    const { dispatch, onClose } = this.props;
    const { modelName, isInsertMode } = this.state;

    dispatch(
      modelsActions.upsert(modelName, { body: { ...fieldPairs, id } }, ({ response, error }) => {
        if (isErrorResponse(error)) {
          const errors = toFormErrors(error.response);
          logger.warn('[upsert callback]', { response, error, errors });
          if (typeof errors === 'string') {
            message.error(toErrorMessage(errors));
          } else {
            this._handleFormChange(errors);
            this.setState({ hasErrors: true });
          }
        } else {
          this.setState({ hasErrors: false });
          // FIXME 当前页面暂未切换为 update 模式，临时关闭当前页面
          if (isInsertMode) {
            EventBus.sendEvent(EventType.MODEL_INSERT, { modelName });
            onClose();
          } else {
            EventBus.sendEvent(EventType.MODEL_UPDATE, { modelName, id });
          }
        }
      }),
    );
  };

  render() {
    const { fields, loadings, status } = this.state;

    logger.log('[render]', { props: this.props, state: this.state });

    // loading 仅在初次加载时渲染，否则编辑器会 lose focus
    const noFields = R.anyPass([R.isEmpty, R.isNil])(fields);
    if (noFields || loadings.LOAD || loadings.INIT) {
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
      <ContentForm
        anchor
        fields={fields}
        onChange={this._handleFormChange}
        onSubmit={this._handleFormSubmit}
      />
    );
  }
}

const mapStateToProps = (state: RootState) => R.pick(['models'])(state.models);

export default connect(mapStateToProps)(ContentUpsert);
