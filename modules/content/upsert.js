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
// import { Promise } from 'bluebird';

const logger = createLogger('modules:content:upsert', 1);

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
    logger.info('fields is', fields);
    logger.info('mapped fields is', mappedFields);
    return mappedFields;
  },
  onFieldsChange(props, changedFields) {
    logger.info('onFieldsChange', props, changedFields);
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
    logger.info('model name is ', modelName);

    const isInsertMode = this.detectUpsertMode(modelName);

    this.state = {
      isInsertMode,
      modelName,
      modelFields: [],
      key        : context.pane.key,
    };
  }


  async componentWillMount(): void {
    const { context, schemas } = this.props;

    // content::create::name::timestamp => name
    const modelName = R.compose(R.nth(2), R.split(/::/), R.path(['pane', 'key']))(context);
    logger.info('model name is ', modelName);

    const allFields     = modelsProxy.getFormFields(schemas, modelName);
    const wrappedFields = await this.asyncWrapAssociations(allFields);

    logger.log('===> async componentDidMount wrappedFields is', wrappedFields);

    const formFields = R.omit(
      ['created_at', 'updated_at'],
      R.mergeDeepRight(allFields, wrappedFields),
    );

    logger.log('form fields is', formFields);

    this.setState({
      modelFields: formFields,
    });
  }

  componentWillReceiveProps(nextProps) {
    logger.info('[lifecycle] componentWillReceiveProps...');
    const { isInsertMode, modelName } = this.state;
    if (!isInsertMode) {
      const { models, context: { pane: { data: { record } } } } = nextProps;

      const fieldValues = R.path([modelName, record.id])(models) || {};
      logger.info('field values is', fieldValues);
      this.handleFormChange(R.map(value => ({ value }))(fieldValues));
    }
  }

  shouldComponentUpdate(nextProps, nextState, nextContext: any): boolean {
    logger.info('[lifecycle] shouldComponentUpdate...', nextProps, nextState, nextContext);
    const { key }       = this.state;
    const { activeKey } = nextProps;
    logger.info('[lifecycle] shouldComponentUpdate', key, activeKey);
    return key === activeKey;
  }

  detectUpsertMode = (modelName) => {
    const { dispatch, context } = this.props;

    const record = R.path(['pane', 'data', 'record'])(context);
    if (record) {
      logger.info('update mode...');
      dispatch(modelsActions.fetch(modelName, { id: record.id, profile: 'detail' }));
      return false;
    }
    return true;
  };

  asyncWrapAssociations = async (fields) => {
    const { auth: { token } } = this.props;

    const associations = R.filter(field => field.type === DynamicFormTypes.Association)(fields);
    logger.info('associations is', associations);

    const wrappedAssociations = await Promise.all(R.values(associations).map(async (field) => {
      const foreignKeys = R.pathOr([], ['options', 'foreignKeys'])(field);
      logger.log('handle field', field, foreignKeys);
      if (foreignKeys && foreignKeys.length > 0) {
        const foreignOpts = R.map((foreignKey) => {
          const [, modelName, property] = foreignKey.match(/t_(\w+)\.(\w+)/);
          return { modelName, property };
        })(foreignKeys);
        logger.info('foreignOpts is', foreignOpts);

        const associationNames = R.pluck('modelName')(foreignOpts);
        logger.info('associationNames is', associationNames);

        const effects = modelsProxy.listAssociationsCallable({ token }, associationNames);
        logger.info('list associations callable', effects);

        const allResponse = await Promise.all(R.values(effects));
        logger.info('allResponse is', allResponse);

        const foreignKeysResponse = R.zipObj(associationNames, R.map(R.prop('data'), allResponse));
        logger.log('foreignOpts is', foreignOpts, 'foreignKeysResponse is', foreignKeysResponse);

        return { ...field, foreignOpts, associations: foreignKeysResponse };
      }
      logger.warn('no foreignKeys with association', field);
      return { ...field, type: DynamicFormTypes.Input };
    }));

    const pairedWrappedAssociations = R.zipObj(R.keys(associations), wrappedAssociations);
    logger.log('wrapped associations', pairedWrappedAssociations);
    return pairedWrappedAssociations;
  };

  /**
   * Saving changed field values in props
   * @param changedFields
   */
  handleFormChange = (changedFields) => {
    logger.info('----> handleFormChange', changedFields);

    const fields            = R.map(field => R.pick(['value'])(field))(changedFields);
    const changedFieldsList = R.mergeDeepRight(this.state.modelFields, fields);
    logger.info('modelFields is', this.state.modelFields);
    logger.info('new fields is', fields);
    logger.info('new changedFieldsList is', changedFieldsList);

    /*
        const { onTitleChange, title } = this.props;

        const idValue   = R.path(['id', 'value'])(changedFieldsList);
        const nameValue = R.path(['name', 'value'])(changedFieldsList);
        const newTitle  = `${idValue},${nameValue}`;
        console.log('title is', title, 'new title is', newTitle);
        if (title !== newTitle && count-- > 0) {
          onTitleChange(newTitle);
        }
    */

    this.setState({
      modelFields: { ...this.state.modelFields, ...changedFieldsList },
    });
  };

  handleFormSubmit = (e) => {
    logger.info('handleFormSubmit', e);
    e.preventDefault();
    const fieldPairs = R.map(R.prop('value'))(this.state.modelFields);
    logger.info('all fieldPairs waiting for submit is', fieldPairs);

    const { dispatch }  = this.props;
    const { modelName } = this.state;

    dispatch(modelsActions.upsert(modelName, { body: fieldPairs }));
  };

  render() {
    const { modelFields } = this.state;
    const { context }     = this.props;

    logger.log('modelFields is ', modelFields);

    if (!modelFields) {
      return <div>loading...</div>;
    }

    return (
      <div>
        <h1>hello, kitty. ^_^</h1>
        <hr />
        <ContentForm
          fields={modelFields}
          onChange={this.handleFormChange}
          onSubmit={this.handleFormSubmit}
        />
        {/* <hr /> */}
        {/* <pre>{JSON.stringify(modelFields, null, 2)}</pre> */}
        <hr />
        <pre>{JSON.stringify(context, null, 2)}</pre>
      </div>
    );
  }
}

const mapStateToProps = state => ({ ...state.models, auth: state.auth });

export default connect(mapStateToProps)(ContentUpsert);
