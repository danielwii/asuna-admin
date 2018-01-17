import React       from 'react';
import PropTypes   from 'prop-types';
import { connect } from 'react-redux';
import * as R      from 'ramda';

import { Form } from 'antd';

import { DynamicForm2, DynamicFormTypes } from '../../components/DynamicForm';
import { modelsProxy }                    from '../../adapters/models';
import { createLogger }                   from '../../adapters/logger';
import { modelsActions }                  from '../../store/models.redux';

const logger = createLogger('modules:content:upsert', '-modules:content:upsert:*');

// --------------------------------------------------------------
// Build Form
// --------------------------------------------------------------

const ContentForm = Form.create({
  mapPropsToFields({ fields }) {
    const mappedFields = R.map(field => Form.createFormField({ ...field }))(fields);
    logger.debug('fields is', fields);
    logger.debug('mapped fields is', mappedFields);
    return mappedFields;
  },
  onFieldsChange(props, changedFields) {
    logger.debug('onFieldsChange', props, changedFields);
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
    models : PropTypes.shape(PropTypes.object),
  };

  constructor(props) {
    super(props);

    const { dispatch, context, schemas } = this.props;

    let isInsertMode = true;

    // content::create::name::timestamp => name
    const modelName = R.compose(R.nth(2), R.split(/::/), R.path(['pane', 'key']))(context);

    const record = R.path(['pane', 'data', 'record'])(context);
    if (record) {
      logger.debug('update mode...');
      isInsertMode = false;
      dispatch(modelsActions.fetch(modelName, { id: record.id, profile: 'detail' }));
    }

    const allFields = modelsProxy.formFields(schemas[modelName], modelName);
    logger.debug('--> form fields is', allFields);

    if (R.has('id')(allFields)) {
      allFields.id.type = DynamicFormTypes.Plain;
    }

    const formFields = R.omit(['created_at', 'updated_at'])(allFields);

    this.state = {
      isInsertMode,
      modelName,
      modelFields: formFields,
    };
  }

  componentWillReceiveProps(nextProps) {
    logger.debug('call componentWillReceiveProps...');
    const { isInsertMode, modelName } = this.state;
    if (!isInsertMode) {
      const { models, context: { pane: { data: { record } } } } = nextProps;

      const fieldValues = R.path([modelName, record.id])(models) || {};
      logger.debug('field values is', fieldValues);
      this.handleFormChange(R.map(value => ({ value }))(fieldValues));
    }
  }

  /**
   * Saving changed field values in props
   * @param changedFields
   */
  handleFormChange = (changedFields) => {
    logger.debug('handleFormChange', changedFields);

    const fields            = R.map(field => R.pick(['value'])(field))(changedFields);
    const changedFieldsList = R.mergeDeepRight(this.state.modelFields, fields);
    logger.debug('new fields is', fields);
    logger.debug('new changedFieldsList is', changedFieldsList);

    this.setState({
      modelFields: { ...this.state.modelFields, ...changedFieldsList },
    });
  };

  handleFormSubmit = (e) => {
    logger.debug('handleFormSubmit', e);
    e.preventDefault();
    const fieldPairs = R.map(R.prop('value'))(this.state.modelFields);
    logger.debug('all fieldPairs waiting for submit is', fieldPairs);

    const { dispatch }  = this.props;
    const { modelName } = this.state;

    dispatch(modelsActions.upsert(modelName, { body: fieldPairs }));
  };

  render() {
    const { modelFields, fieldValues } = this.state;
    const { context }                  = this.props;

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
        <pre>{JSON.stringify(fieldValues, null, 2)}</pre>
        <hr />
        <pre>{JSON.stringify(context, null, 2)}</pre>
      </div>
    );
  }
}

const mapStateToProps = state => ({ ...state.models });

export default connect(mapStateToProps)(ContentUpsert);
