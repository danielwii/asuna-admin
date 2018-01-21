import React       from 'react';
import PropTypes   from 'prop-types';
import { connect } from 'react-redux';
import * as R      from 'ramda';
import moment      from 'moment';
import { Form }    from 'antd';

import { DynamicForm2, DynamicFormTypes } from '../../components/DynamicForm';
import { modelsProxy }                    from '../../adapters/models';
import { createLogger }                   from '../../adapters/logger';
import { modelsActions }                  from '../../store/models.redux';

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
    logger.info('[ContentForm][mapPropsToFields] fields is', fields);
    logger.info('[ContentForm][mapPropsToFields] mapped fields is', mappedFields);
    return mappedFields;
  },
  onFieldsChange(props, changedFields) {
    logger.info('[ContentForm][onFieldsChange] onFieldsChange', props, changedFields);
    props.onChange(changedFields);
  },
})(DynamicForm2);

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

class ContentUpsert extends React.Component {
  static propTypes = {
    context: PropTypes.shape({
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
  };

  constructor(props) {
    super(props);

    const { context } = this.props;

    // content::create::name::timestamp => name
    const modelName = R.compose(R.nth(2), R.split(/::/), R.path(['pane', 'key']))(context);
    logger.info('[constructor] model name is ', modelName);

    const isInsertMode = this.detectUpsertMode(modelName);

    this.state = {
      isInsertMode,
      modelName,
      modelFields: {},
      key        : context.pane.key,
    };
  }


  async componentWillMount(): void {
    logger.info('[componentWillMount]...');
    const { context, schemas } = this.props;

    // content::create::name::timestamp => name
    const modelName = R.compose(R.nth(2), R.split(/::/), R.path(['pane', 'key']))(context);
    logger.info('[componentWillMount] model name is ', modelName);

    const allFields = modelsProxy.getFormFields(schemas, modelName);
    // const allFields  = {
    //   id        : allFields1.id,
    //   name      : allFields1.name,
    //   country_id: allFields1.country_id,
    // };

    logger.info('[componentWillMount] allFields is', allFields);

    const wrappedFields = await this.asyncWrapAssociations(allFields);

    logger.info('[componentWillMount] wrappedFields is', wrappedFields);

    const formFields = R.omit(
      ['created_at', 'updated_at'],
      R.mergeDeepRight(allFields, wrappedFields),
    );

    logger.info('[componentWillMount] form fields is', formFields);

    // !!important!!
    // associations is loaded in async mode, so the models may already set in state
    this.setState({
      modelFields: R.mergeDeepRight(formFields, this.state.modelFields),
    });
  }

  componentWillReceiveProps(nextProps) {
    logger.info('[componentWillReceiveProps]...');
    const { isInsertMode, modelName } = this.state;
    if (!isInsertMode) {
      const { models, context: { pane: { data: { record } } } } = nextProps;

      const fieldValues = R.path([modelName, record.id])(models) || {};
      logger.info('[componentWillReceiveProps] field values is', fieldValues);
      this.handleFormChange(R.map(value => ({ value }))(fieldValues));
    }
  }

  shouldComponentUpdate(nextProps, nextState, nextContext: any): boolean {
    logger.info('[shouldComponentUpdate]...', nextProps, nextState, nextContext);
    const { key }       = this.state;
    const { activeKey } = nextProps;
    logger.info('[shouldComponentUpdate]', key, activeKey);
    return key === activeKey;
  }

  detectUpsertMode = (modelName) => {
    const { dispatch, context } = this.props;

    const record = R.path(['pane', 'data', 'record'])(context);
    if (record) {
      logger.info('[detectUpsertMode] update mode...');
      dispatch(modelsActions.fetch(modelName, { id: record.id, profile: 'detail' }));
      return false;
    }
    return true;
  };

  asyncWrapAssociations = async (fields) => {
    const { auth: { token } } = this.props;

    const associations = R.filter(field => field.type === DynamicFormTypes.Association)(fields);
    logger.info('[asyncWrapAssociations] associations is', associations);

    const wrappedAssociations = await Promise.all(R.values(associations).map(async (field) => {
      const foreignKeys = R.pathOr([], ['options', 'foreignKeys'])(field);
      logger.log('[asyncWrapAssociations] handle field', field, foreignKeys);
      if (foreignKeys && foreignKeys.length > 0) {
        const fieldsOfAssociations = modelsProxy.getFieldsOfAssociations();

        const foreignOpts = R.map((foreignKey) => {
          const [, modelName, property] = foreignKey.match(/t_(\w+)\.(\w+)/);
          const association             = fieldsOfAssociations[modelName];
          return { modelName, property, association };
        })(foreignKeys);
        logger.info('[asyncWrapAssociations] foreignOpts is', foreignOpts);

        const associationNames = R.pluck('modelName')(foreignOpts);
        logger.info('[asyncWrapAssociations] associationNames is', associationNames);

        const effects = modelsProxy.listAssociationsCallable({ token }, associationNames);
        logger.info('[asyncWrapAssociations] list associations callable', effects);

        const allResponse = await Promise.all(R.values(effects));
        logger.info('[asyncWrapAssociations] allResponse is', allResponse);

        const foreignKeysResponse = R.zipObj(associationNames, R.map(R.prop('data'), allResponse));
        logger.info('[asyncWrapAssociations] foreignOpts is', foreignOpts, 'foreignKeysResponse is', foreignKeysResponse);

        return { ...field, foreignOpts, associations: foreignKeysResponse };
      }
      logger.warn('[asyncWrapAssociations] no foreignKeys with association', field);
      return { ...field, type: DynamicFormTypes.Input };
    }));

    const pairedWrappedAssociations = R.zipObj(R.keys(associations), wrappedAssociations);
    logger.log('[asyncWrapAssociations] wrapped associations', pairedWrappedAssociations);
    return pairedWrappedAssociations;
  };

  /**
   * Saving changed field values in props
   * @param changedFields
   */
  handleFormChange = (changedFields) => {
    logger.log('[handleFormChange] handleFormChange', changedFields);

    const fields            = R.map(field => R.pick(['value'])(field))(changedFields);
    const changedFieldsList = R.mergeDeepRight(this.state.modelFields, fields);
    logger.info('[handleFormChange] modelFields is', this.state.modelFields);
    logger.info('[handleFormChange] new fields is', fields);
    logger.info('[handleFormChange] new changedFieldsList is', changedFieldsList);

    this.setState({
      modelFields: { ...this.state.modelFields, ...changedFieldsList },
    });
  };

  handleFormSubmit = (e) => {
    logger.info('[handleFormSubmit] handleFormSubmit', e);
    e.preventDefault();
    const fieldPairs = R.map(R.prop('value'))(this.state.modelFields);
    logger.info('[handleFormSubmit] all fieldPairs waiting for submit is', fieldPairs);

    const { dispatch }  = this.props;
    const { modelName } = this.state;

    dispatch(modelsActions.upsert(modelName, { body: fieldPairs }));
  };

  render() {
    const { modelFields } = this.state;
    const { context }     = this.props;

    if (R.anyPass([R.isEmpty, R.isNil])(modelFields)) {
      return <div>loading...</div>;
    }

    logger.log('[render] modelFields is ', modelFields);

    return (
      <div>
        <h1>hello, kitty. ^_^</h1>
        <hr />
        <ContentForm
          fields={modelFields}
          onChange={this.handleFormChange}
          onSubmit={this.handleFormSubmit}
        />
        <hr />
        <pre>{JSON.stringify(modelFields, null, 2)}</pre>
        <hr />
        <pre>{JSON.stringify(this.state, null, 2)}</pre>
        <hr />
        <pre>{JSON.stringify(context, null, 2)}</pre>
      </div>
    );
  }
}

const mapStateToProps = state => ({ ...state.models, auth: state.auth });

export default connect(mapStateToProps)(ContentUpsert);
