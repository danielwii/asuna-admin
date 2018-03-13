import React       from 'react';
import PropTypes   from 'prop-types';
import { connect } from 'react-redux';
import * as R      from 'ramda';
import moment      from 'moment';

import { Form, Icon, message } from 'antd';

import { DynamicForm2, DynamicFormTypes } from '../../components/DynamicForm';
import { modelsProxy }                    from '../../adapters/models';
import { createLogger }                   from '../../adapters/logger';
import { modelsActions }                  from '../../store/models.redux';
import { schemaHelper, diff }             from '../../helpers';

const logger = createLogger('modules:content:upsert');

// --------------------------------------------------------------
// Build Form
// --------------------------------------------------------------

const ContentForm = Form.create({
  mapPropsToFields({ fields }) {
    const mappedFields = R.map((field) => {
      if (field.value && field.type === DynamicFormTypes.DateTime) {
        return Form.createFormField({ ...field, value: moment(field.value) });
      }
      return Form.createFormField({ ...field });
    })(fields);
    logger.info('[ContentForm][mapPropsToFields]', ' fields is', fields);
    logger.info('[ContentForm][mapPropsToFields]', ' mapped fields is', mappedFields);
    return mappedFields;
  },
  onFieldsChange(props, changedFields) {
    logger.info('[ContentForm][onFieldsChange]', 'onFieldsChange', props, changedFields);
    const filteredChangedFields = R.compose(
      R.pickBy((field, key) => {
        const oldVar = R.path(['fields', key, 'value'])(props);
        const newVar = field.value;
        logger.info('[ContentForm][onFieldsChange]', 'oldVar is', oldVar, 'newVar is', newVar);
        return oldVar !== newVar;
      }),
      R.map((field) => {
        let { value } = field;
        // eslint-disable-next-line no-underscore-dangle
        if (value && value._isAMomentObject) {
          value = value.toDate();
        }
        return { ...field, value };
      }),
    )(changedFields);
    logger.info('[ContentForm][onFieldsChange]', 'real changed fields is', filteredChangedFields);
    props.onChange(filteredChangedFields);
  },
})(DynamicForm2);

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

class ContentUpsert extends React.Component {
  static propTypes = {
    basis  : PropTypes.shape({
      pane: PropTypes.shape({
        key : PropTypes.string,
        data: PropTypes.shape({
          model : PropTypes.string,
          record: PropTypes.any,
        }),
      }),
    }),
    schemas: PropTypes.shape({}),
    models : PropTypes.shape({}),
    auth   : PropTypes.shape({}),
    onClose: PropTypes.func,
  };

  constructor(props) {
    super(props);

    const { basis } = this.props;

    // content::create::name::timestamp => name
    const modelName = R.compose(R.nth(2), R.split(/::/), R.path(['pane', 'key']))(basis);
    logger.info('[constructor]', 'model name is ', modelName);

    const isInsertMode = this.detectUpsertMode(modelName);

    this.state = {
      preDecorators: [
        schemaHelper.enumDecorator,
      ],
      isInsertMode,
      modelName,
      init         : true,
      fields       : {},
      key          : basis.pane.key,
    };
  }

  async componentWillMount() {
    logger.log('[componentWillMount]', { props: this.props, state: this.state });
    const { basis, schemas } = this.props;

    // content::create::name::timestamp => name
    const modelName = R.compose(R.nth(2), R.split(/::/), R.path(['pane', 'key']))(basis);
    logger.info('[componentWillMount]', 'model name is ', modelName);

    // --------------------------------------------------------------
    // Build form fields with all needed data
    // --------------------------------------------------------------

    const formSchema = modelsProxy.getFormSchema(schemas, modelName);

    // if (modelName === 'colleges') {
    //   formSchema = R.pick(['id', 'name', 'name_en', 'sequences'], formSchema);
    // }
    logger.info('[componentWillMount]', 'formSchema is', formSchema);

    const withAssociations = await this.asyncWrapAssociations(formSchema);

    logger.info('[componentWillMount]', 'withAssociations is', withAssociations);

    const formFields = R.omit(
      ['created_at', 'updated_at'],
      R.mergeDeepRight(formSchema, withAssociations),
    );

    logger.info('[componentWillMount]', 'form fields is', formFields);

    // --------------------------------------------------------------
    // Using pre decorators instead
    // --------------------------------------------------------------
    // const filteredFields = schemaHelper.doEnumDecorator(formFields);

    const { preDecorators } = this.state;
    const decoratedFields   = R.pipe(...preDecorators)(
      // !!important!!
      // associations is loaded in async mode, so the models may already set in state
      // it have to be merged with fields in state
      R.mergeDeepRight(formFields, this.state.fields),
    );

    this.setState({
      wrappedFormSchema: formFields,      // 用于在更新时重新构造完整（会又被过滤的部分）的数据结构
      fields           : decoratedFields, // 最终渲染的对象
    });
  }

  /**
   * update 模式时第一次加载数据需要通过异步获取到的数据进行渲染。
   * 渲染成功后则不再处理 props 的数据更新，以保证当前用户的修改不会丢失。
   * @param nextProps
   */
  componentWillReceiveProps(nextProps) {
    logger.log('[componentWillReceiveProps]', {
      props: this.props, state: this.state, nextProps,
    });
    const { isInsertMode, modelName, init } = this.state;
    if (!isInsertMode && init) {
      const { models, basis: { pane: { data: { record } } } } = nextProps;

      logger.info('[componentWillReceiveProps]', { modelName, record });
      const fieldValues = R.pathOr({}, [modelName, record.id])(models);
      logger.log('[componentWillReceiveProps]', 'field values is', fieldValues);
      this.handleFormChange(R.map(value => ({ value }))(fieldValues));
      this.setState({ init: false, originalFieldValues: fieldValues });
    }
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    const { key }       = this.state;
    const { activeKey } = nextProps;
    // const propsDiff     = false;
    const propsDiff     = diff(this.props, nextProps);
    const stateDiff     = diff(this.state, nextState);
    const samePane      = key === activeKey;
    const shouldUpdate  = samePane && (propsDiff.isDifferent || stateDiff.isDifferent);
    logger.log('[shouldComponentUpdate]',
      { nextProps, nextState, nextContext }, shouldUpdate,
      { samePane, propsDiff, stateDiff });
    return shouldUpdate;
  }

  detectUpsertMode = (modelName) => {
    const { dispatch, basis } = this.props;

    const record = R.path(['pane', 'data', 'record'])(basis);
    if (record) {
      logger.info('[detectUpsertMode]', 'set to update mode and load model...', record);
      dispatch(modelsActions.fetch(modelName, { id: record.id }));
      return false;
    }
    return true;
  };

  asyncWrapAssociations = async (fields) => {
    this.setState({ loading: true });

    if (R.compose(R.isEmpty, R.isNil)(fields)) {
      logger.info('[asyncWrapAssociations]', 'no associations found.');
      return {};
    }

    const { auth } = this.props;

    const relationShips = [DynamicFormTypes.Association, DynamicFormTypes.ManyToMany];

    const associations = R.filter(field => R.contains(field.type)(relationShips))(fields);
    logger.info('[asyncWrapAssociations]', 'associations is', associations);

    const wrappedAssociations = await Promise.all(R.values(associations).map(async (field) => {
      const foreignKeys = R.pathOr([], ['options', 'foreignKeys'])(field);
      logger.info('[asyncWrapAssociations]', 'handle field', field, foreignKeys);
      if (foreignKeys && foreignKeys.length > 0) {
        const fieldsOfAssociations = modelsProxy.getFieldsOfAssociations();

        const foreignOpts = R.map((foreignKey) => {
          const regex = foreignKey.startsWith('t_')
            ? /t_(\w+)\.(\w+)/  // t_model.id -> model
            : /(\w+)\.(\w+)/;   // model.id   -> model

          // update model_name to model-name
          const [, modelName, property] = foreignKey.match(regex);

          const association = fieldsOfAssociations[modelName];
          return { modelName, property, association };
        })(foreignKeys);
        logger.info('[asyncWrapAssociations]', 'foreignOpts is', foreignOpts);

        const associationNames = R.pluck('modelName')(foreignOpts);
        logger.info('[asyncWrapAssociations]', 'associationNames is', associationNames);

        const effects = modelsProxy.listAssociationsCallable(auth, associationNames);
        logger.info('[asyncWrapAssociations]', 'list associations callable', effects);

        let allResponse = {};
        try {
          allResponse = await Promise.all(R.values(effects));
          logger.info('[asyncWrapAssociations]', 'allResponse is', allResponse);
        } catch (e) {
          logger.error('[asyncWrapAssociations]', e);
          message.error(`Load associations error: ${e.message}`);
        }

        const foreignKeysResponse = R.zipObj(associationNames, R.map(R.prop('data'), allResponse));
        logger.info('[asyncWrapAssociations]', 'foreignOpts is', foreignOpts, 'foreignKeysResponse is', foreignKeysResponse);

        return { ...field, foreignOpts, associations: foreignKeysResponse };
      }
      logger.warn('[asyncWrapAssociations]', 'no foreignKeys with association', field);
      return { ...field, type: DynamicFormTypes.Input };
    }));

    const pairedWrappedAssociations = R.zipObj(R.keys(associations), wrappedAssociations);
    logger.info('[asyncWrapAssociations]', 'wrapped associations', pairedWrappedAssociations);
    this.setState({ loading: false });
    return pairedWrappedAssociations;
  };

  /**
   * Saving changed field values in props
   * @param changedFields
   */
  handleFormChange = (changedFields) => {
    if (!R.isEmpty(changedFields)) {
      logger.log('[handleFormChange]', { changedFields });
      const { wrappedFormSchema, fields, preDecorators } = this.state;

      const currentChangedFields = R.map(R.pick(['value']))(changedFields);
      const changedFieldsBefore  = R.mergeDeepRight(wrappedFormSchema, fields);
      const allChangedFields     = R.mergeDeepRight(changedFieldsBefore, currentChangedFields);
      const decoratedFields      = R.pipe(...preDecorators)(allChangedFields);
      logger.info('[handleFormChange]', {
        currentChangedFields, changedFieldsBefore, allChangedFields, decoratedFields,
      });

      this.setState({
        fields: decoratedFields,
      });
    }
  };

  handleFormSubmit = (e) => {
    logger.info('[handleFormSubmit]', 'handleFormSubmit', e);
    e.preventDefault();
    const { originalFieldValues } = this.state;

    const fieldPairs = R.compose(
      R.pickBy((value, key) => (originalFieldValues ? value !== originalFieldValues[key] : true)),
      R.map(R.prop('value')),
    )(this.state.fields);
    logger.info('[handleFormSubmit]', 'all fieldPairs waiting for submit is', fieldPairs);

    const id = R.prop('id')(originalFieldValues);

    const { dispatch, onClose }       = this.props;
    const { modelName, isInsertMode } = this.state;

    dispatch(modelsActions.upsert(modelName, { body: { ...fieldPairs, id } }));

    // FIXME 在 post 提交后暂时无法获取返回的 id，即当前页面暂时无法切换为 update 模式，暂时关闭当前页面
    if (isInsertMode) {
      onClose();
    }
  };

  render() {
    const { fields, loading } = this.state;
    const { auth }            = this.props;

    if (R.anyPass([R.isEmpty, R.isNil])(fields) || loading) {
      return (
        <div>
          <Icon type="loading" style={{ marginLeft: 8, fontSize: 24 }} spin />
          {/* language=CSS */}
          <style jsx>{`
            div {
              width: 100%;
              margin: 10rem 0;
              text-align: center;
            }
          `}</style>
        </div>
      );
    }

    logger.log('[render]', { props: this.props, state: this.state });

    return (
      <div>
        <hr />
        <ContentForm
          auth={auth}
          fields={fields}
          onChange={this.handleFormChange}
          onSubmit={this.handleFormSubmit}
        />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  ...R.pick(['schemas', 'models'])(state.models),
  auth: state.auth,
});

export default connect(mapStateToProps)(ContentUpsert);
