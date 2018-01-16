import React       from 'react';
import PropTypes   from 'prop-types';
import { connect } from 'react-redux';
import * as R      from 'ramda';

import { Form } from 'antd';

import { DynamicForm2, DynamicFormTypes } from '../../components/DynamicForm';
import { modelsProxy }                    from '../../adapters/models';

const ContentForm = Form.create({
  mapPropsToFields({ fields, values }) {
    const mappedFields = R.map(field => Form.createFormField({ ...field }))(fields);
    console.log('fields is', fields);
    console.log('values is', values);
    console.log('mapped fields is', mappedFields);
    return mappedFields;
  },
  onFieldsChange(props, changedFields) {
    console.log('onFieldsChange', props, changedFields);
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

    const actions = null;

    // content::create::name::timestamp => name
    const model       = R.compose(R.nth(2), R.split(/::/), R.path(['pane', 'key']))(context);
    const configs     = modelsProxy.modelConfigs(model);
    const modelConfig = R.prop('model')(configs)(actions);
    console.log('--> modelFields in config is', modelConfig);

    const allFields = modelsProxy.formFields(schemas[model], model);
    console.log('--> form fields is', allFields);

    if (R.has('id')(allFields)) {
      allFields.id.type = DynamicFormTypes.Plain;
    }

    const formFields = R.omit(['created_at', 'updated_at'])(allFields);

    this.state = {
      modelFields: formFields || modelConfig.fields,
      fieldValues: {},
    };
  }

  handleFormChange = (changedFields) => {
    console.log('handleFormChange', changedFields);
    this.setState({
      fieldValues: { ...this.state.fields, ...changedFields },
    });
  };

  render() {
    const { modelFields, fieldValues } = this.state;
    const { context }                  = this.props;

    return (
      <div>
        <h1>hello, kitty. ^_^</h1>
        <hr />
        <ContentForm fields={modelFields} values={fieldValues} onChange={this.handleFormChange} />
        <hr />
        {/* <pre>{JSON.stringify(modelFields, null, 2)}</pre> */}
        <pre>{JSON.stringify(fieldValues, null, 2)}</pre>
        <hr />
        <pre>{JSON.stringify(context, null, 2)}</pre>
      </div>
    );
  }
}

const mapStateToProps = state => ({ ...state.models });

export default connect(mapStateToProps)(ContentCreate);
