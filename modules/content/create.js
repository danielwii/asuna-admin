import React       from 'react';
import PropTypes   from 'prop-types';
import { connect } from 'react-redux';
import * as R      from 'ramda';

import { Form } from 'antd';

import { DynamicForm2, DynamicFormTypes } from '../../components/DynamicForm';
import { modelsProxy }                    from '../../adapters/models';
import { logger }                         from '../../adapters/logger';
import { modelsActions }                  from '../../store/models.redux';

const ContentForm = Form.create({
  mapPropsToFields({ fields }) {
    const mappedFields = R.map(field => Form.createFormField({ ...field }))(fields);
    logger.log('fields is', fields);
    logger.log('mapped fields is', mappedFields);
    return mappedFields;
  },
  onFieldsChange(props, changedFields) {
    logger.log('onFieldsChange', props, changedFields);
    props.onChange(changedFields);
  },
})(DynamicForm2);

class ContentCreate extends React.Component {
  static propTypes = {
    context: PropTypes.shape({
      pane: PropTypes.shape({
        key: PropTypes.string,
      }),
    }),
    schemas: PropTypes.shape({}),
  };

  constructor(props) {
    super(props);

    const { context, schemas } = this.props;

    // content::create::name::timestamp => name
    const model = R.compose(R.nth(2), R.split(/::/), R.path(['pane', 'key']))(context);

    const allFields = modelsProxy.formFields(schemas[model], model);
    logger.log('--> form fields is', allFields);

    if (R.has('id')(allFields)) {
      allFields.id.type = DynamicFormTypes.Plain;
    }

    const formFields = R.omit(['created_at', 'updated_at'])(allFields);

    this.state = {
      model,
      modelFields: { name: formFields.name, introduction: formFields.introduction },
    };
  }

  /**
   * Saving changed field values in props
   * @param changedFields
   */
  handleFormChange = (changedFields) => {
    logger.log('handleFormChange', changedFields);

    const fields            = R.map(field => R.pick(['value'])(field))(changedFields);
    const changedFieldsList = R.mergeDeepRight(this.state.modelFields, fields);
    logger.log('new fields is', fields);
    logger.log('new changedFieldsList is', changedFieldsList);

    this.setState({
      modelFields: { ...this.state.modelFields, ...changedFieldsList },
    });
  };

  handleFormSubmit = (e) => {
    logger.log('handleFormSubmit', e);
    e.preventDefault();
    const fieldPairs = R.map(R.prop('value'))(this.state.modelFields);
    logger.log('all fieldPairs waiting for submit is', fieldPairs);

    const { dispatch } = this.props;
    const { model }    = this.state;

    dispatch(modelsActions.upsert(model, fieldPairs));
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

export default connect(mapStateToProps)(ContentCreate);
