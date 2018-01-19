import React       from 'react';
import PropTypes   from 'prop-types';
import { connect } from 'react-redux';
import * as R      from 'ramda';
import moment      from 'moment';

import { Form } from 'antd';

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

    const { dispatch, context, schemas } = this.props;

    let isInsertMode = true;

    // content::create::name::timestamp => name
    const modelName = R.compose(R.nth(2), R.split(/::/), R.path(['pane', 'key']))(context);
    logger.info('model name is ', modelName);

    const record = R.path(['pane', 'data', 'record'])(context);
    if (record) {
      logger.info('update mode...');
      isInsertMode = false;
      dispatch(modelsActions.fetch(modelName, { id: record.id, profile: 'detail' }));
    }

    const allFields = modelsProxy.getFormFields(schemas, modelName);
    logger.info('form fields is', allFields);

    if (R.has('id')(allFields)) {
      allFields.id.type = DynamicFormTypes.Plain;
    }

    const formFields = R.omit(['created_at', 'updated_at'])(allFields);

    this.state = {
      isInsertMode,
      modelName,
      modelFields: formFields,
      key        : context.pane.key,
    };
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

const mapStateToProps = state => ({ ...state.models });

export default connect(mapStateToProps)(ContentUpsert);
