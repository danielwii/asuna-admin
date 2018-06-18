import React from 'react';
import { connect } from 'react-redux';
import * as R from 'ramda';
import _ from 'lodash';
import moment from 'moment';

import { Form, Icon, message } from 'antd';

import { diff, isErrorResponse, toFormErrors } from '../../helpers';
import { DynamicForm2, DynamicFormTypes } from '../../components/DynamicForm';

import { modelProxy } from '../../adapters/model';
import { AuthState } from '../../store/auth.redux';
import { modelsActions } from '../../store/model.redux';
import * as schemaHelper from '../../helpers/schema';
import { Pane } from '../../components/Panes';
import { createLogger, lv } from '../../helpers/logger';

const logger = createLogger('modules:content:upsert', 'warn');

// --------------------------------------------------------------
// Build Form
// --------------------------------------------------------------

const ContentForm = Form.create({
  mapPropsToFields({ fields }) {
    const mappedFields = R.map(field => {
      // DatePicker for antd using moment instance
      const isDate = R.contains(field.type)([DynamicFormTypes.Date, DynamicFormTypes.DateTime]);
      if (field.value && isDate) {
        return Form.createFormField({ ...field, value: moment(field.value) });
      }
      return Form.createFormField({ ...field });
    })(fields);
    logger.debug('[ContentForm][mapPropsToFields]', ' fields is', fields);
    logger.debug('[ContentForm][mapPropsToFields]', ' mapped fields is', mappedFields);
    return mappedFields;
  },
  onFieldsChange(props: any, changedFields) {
    logger.debug('[ContentForm][onFieldsChange]', 'onFieldsChange', props, changedFields);
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
        // eslint-disable-next-line no-underscore-dangle
        if (value && value._isAMomentObject) {
          value = value.toDate();
        }
        return { ...field, value };
      }),
      // remove fields when validating=true
      R.filter(field => !R.prop('validating', field)),
    )(changedFields);
    if (!R.isEmpty(filteredChangedFields)) {
      logger.debug(
        '[ContentForm][onFieldsChange]',
        'real changed fields is',
        filteredChangedFields,
      );
      props.onChange(filteredChangedFields);
    }
  },
})(DynamicForm2);

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

interface IProps extends ReduxProps {
  basis: { pane: Pane };
  schemas: object;
  models: object;
  auth: AuthState;
  onClose: () => void;
}

interface IState {
  preDecorators: (tag: string) => any[];
  asyncDecorators: (tag: string) => any[];
  isInsertMode: boolean;
  modelName: string;
  init: boolean;
  loadings: { INIT: boolean; LOAD: boolean; ASSOCIATIONS: boolean };
  fields: FormField[];
  key: string;
  hasErrors: boolean;
  originalFieldValues?: object;
  wrappedFormSchema?: object;
}

class ContentUpsert extends React.Component<IProps, IState> {
  constructor(props) {
    super(props);

    const { basis } = this.props;

    // content::create::name::timestamp => name
    const modelName = R.compose(
      R.nth(2),
      R.split(/::/),
      R.path(['pane', 'key']),
    )(basis);
    logger.debug('[constructor]', 'model name is ', modelName);

    const isInsertMode = this.detectUpsertMode(modelName);

    this.state = {
      preDecorators: tag => [
        schemaHelper.peek(`before-${tag}`),
        schemaHelper.hiddenComponentDecorator,
        schemaHelper.jsonDecorator,
        schemaHelper.enumDecorator,
        schemaHelper.associationDecorator,
        schemaHelper.peek(`after-${tag}`),
      ],
      asyncDecorators: tag => [
        // TODO 目前异步数据拉取无法在页面上显示对应字段的 loading 状态
        async fields => R.curry(schemaHelper.peek(`before-async-${tag}`))(fields),
        // async fields => schemaHelper.hiddenComponentDecorator(fields),
        schemaHelper.asyncLoadAssociationsDecorator,
        async fields => R.curry(schemaHelper.peek(`after-async-${tag}`))(fields),
      ],
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
    const { basis, schemas } = this.props;
    const { isInsertMode } = this.state;

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

    const formSchema = modelProxy.getFormSchema(schemas, modelName);

    // if (modelName === 'colleges') {
    //   formSchema = R.pick(['id', 'name', 'name_en', 'sequences'], formSchema);
    // }

    const formFields = R.omit(['created_at', 'updated_at'])(formSchema);
    logger.debug('[componentWillMount]', 'form fields is', formFields);

    // --------------------------------------------------------------
    // Using pre decorators instead
    // --------------------------------------------------------------

    const { preDecorators, asyncDecorators } = this.state;

    let decoratedFields = R.pipe(...preDecorators('INIT'))(formFields);

    // INSERT-MODE: 仅在新增模式下拉取数据
    if (isInsertMode) {
      decoratedFields = await R.pipeP(...asyncDecorators('ASSOCIATIONS'))(decoratedFields);
    }

    this.setState({
      fields: decoratedFields,
      wrappedFormSchema: formFields,
      loadings: { ...this.state.loadings, INIT: false, ASSOCIATIONS: false },
    });
  }

  /**
   * update 模式时第一次加载数据需要通过异步获取到的数据进行渲染。
   * 渲染成功后则不再处理 props 的数据更新，以保证当前用户的修改不会丢失。
   * @param nextProps
   */
  componentWillReceiveProps(nextProps) {
    logger.log('[componentWillReceiveProps]', {
      props: this.props,
      state: this.state,
      nextProps,
    });
    const { isInsertMode, modelName, init } = this.state;
    // 初次更新时加载数据
    if (!isInsertMode && init) {
      const {
        models,
        basis: {
          pane: {
            data: { record },
          },
        },
      } = nextProps;

      logger.debug('[componentWillReceiveProps]', { modelName, record });
      const fieldValues = R.pathOr({}, [modelName, record.id])(models);
      logger.log('[componentWillReceiveProps]', 'field values is', fieldValues);
      this.handleFormChange(R.map(value => ({ value }))(fieldValues));
      this.setState({ originalFieldValues: fieldValues });
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
    // const propsDiff     = diff(this.props, nextProps);
    const stateDiff = diff(this.state, nextState, { include: ['fields', 'loadings'] });
    const samePane = key === activeKey;
    const shouldUpdate =
      samePane && (propsDiff.isDifferent || stateDiff.isDifferent || this.state.hasErrors);
    logger.log('[shouldComponentUpdate]', { nextProps, nextState, nextContext }, shouldUpdate, {
      samePane,
      propsDiff,
      stateDiff,
      hasErrors: this.state.hasErrors,
    });
    return shouldUpdate;
  }

  detectUpsertMode = modelName => {
    const { dispatch, basis } = this.props;

    const record = R.path(['pane', 'data', 'record'])(basis);
    if (record) {
      logger.debug('[detectUpsertMode]', 'set to update mode and load model...', record);
      dispatch(modelsActions.fetch(modelName, { id: record.id, profile: 'detail' }));
      return false;
    }
    return true;
  };

  /**
   * Saving changed field values in props
   * @param changedFields
   */
  handleFormChange = async changedFields => {
    const { isInsertMode, init } = this.state;
    logger.log('[handleFormChange]', { changedFields, state: this.state });
    if (!R.isEmpty(changedFields)) {
      const { wrappedFormSchema, fields, preDecorators, asyncDecorators } = this.state;

      const currentChangedFields = R.map(R.pick(['value', 'errors']))(changedFields);
      const changedFieldsBefore = R.mergeDeepRight(wrappedFormSchema, fields);
      const allChangedFields = R.mergeDeepRight(changedFieldsBefore, currentChangedFields);
      // 这里只装饰变化的 fields
      const decoratedFields = R.pipe(...preDecorators('LOAD'))(allChangedFields);

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
          loadings: { ...this.state.loadings, ASSOCIATIONS: true },
        });
        logger.debug('[handleFormChange]', 'load async decorated fields');
        const asyncDecoratedFields = await R.pipeP(...asyncDecorators('ASSOCIATIONS'))(
          decoratedFields,
        );
        this.setState({
          init: false,
          loadings: { ...this.state.loadings, LOAD: false, ASSOCIATIONS: false },
          fields: asyncDecoratedFields,
        });
      } else {
        this.setState({
          fields: decoratedFields,
          loadings: { ...this.state.loadings, LOAD: false, ASSOCIATIONS: false },
        });
      }
    }
  };

  handleFormSubmit = event => {
    logger.debug('[handleFormSubmit]', event);
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
          if (_.isString(errors)) {
            message.error(errors);
          } else {
            this.handleFormChange(errors);
            this.setState({ hasErrors: true });
          }
        } else {
          this.setState({ hasErrors: false });
          // FIXME 当前页面暂未切换为 update 模式，临时关闭当前页面
          if (isInsertMode) {
            onClose();
          }
        }
      }),
    );
  };

  render() {
    const { fields, loadings } = this.state;
    const { auth } = this.props;

    logger.log('[render]', { props: this.props, state: this.state });

    // loading 尽在初次加载时渲染，否则编辑器会 lose focus
    const noFields = R.anyPass([R.isEmpty, R.isNil])(fields);
    if (noFields || R.any(R.equals(true), R.values(loadings))) {
      return (
        <React.Fragment>
          <Icon type="loading" style={{ fontSize: 24 }} spin />
          {/* language=CSS */}
          <style jsx>{`
            div {
              width: 100%;
              margin: 10rem 0;
              text-align: center;
            }
          `}</style>
        </React.Fragment>
      );
    }

    return (
      <ContentForm
        anchor
        auth={auth}
        fields={fields}
        onChange={this.handleFormChange}
        onSubmit={this.handleFormSubmit}
      />
    );
  }
}

const mapStateToProps = state => ({
  ...R.pick(['schemas', 'models'])(state.models),
  auth: state.auth,
});

export default connect(mapStateToProps)(ContentUpsert); // as any as typeof ContentUpsert;
