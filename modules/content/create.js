import React       from 'react';
import { connect } from 'react-redux';
import * as R      from 'ramda';

import { Form } from 'antd';

import { DynamicForm2 } from '../../components/DynamicForm';
import { modelsProxy }  from '../../adapters/models';

const ContentForm = Form.create({
  mapPropsToFields({ fields, values }) {
    const mappedFields = R.map(field => Form.createFormField({ ...field }))(fields);
    console.log('fields is', fields);
    console.log('values is', values);
    console.log('mapped fields is', mappedFields);
    // return {
    //   name: Form.createFormField({ ...fields.name }),
    // };
    return mappedFields;
  },
  onFieldsChange(props, changedFields) {
    console.log('onFieldsChange', props, changedFields);
    props.onChange(changedFields);
  },
})(DynamicForm2);

class ContentCreate extends React.Component {
  // state = {
  //   // fieldDefinitions: {
  //   //   name: {
  //   //     name : 'name',
  //   //     label: '名称',
  //   //     type : DynamicFormTypes.Input,
  //   //     // value: R.path(['name', 'value'])(model),
  //   //   },
  //   // },
  //   fieldValues     : {},
  // };

  constructor(props) {
    super(props);

    const { dispatch, context } = this.props;

    const actions = null;

    // content::create::colleges::timestamp => colleges
    const model       = R.compose(R.nth(2), R.split(/::/), R.path(['pane', 'key']))(context);
    const configs     = modelsProxy.modelConfigs(model);
    const modelConfig = R.prop('model')(configs)(actions);
    console.log('--> modelFields in config is', modelConfig);

    this.state = {
      modelFields: modelConfig.fields,
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

    // const formFields = (model = {}) => ({
    //   name: {
    //     name : 'name',
    //     label: '名称',
    //     type : DynamicFormTypes.Input,
    //     value: R.path(['name', 'value'])(model),
    //   },
    // });

    return (
      <div>
        <h1>hello, kitty.</h1>
        <hr />
        <ContentForm fields={modelFields} values={fieldValues} onChange={this.handleFormChange} />
        <hr />
        <pre>{JSON.stringify(modelFields, null, 2)}</pre>
        <pre>{JSON.stringify(fieldValues, null, 2)}</pre>
        <hr />
        <pre>{JSON.stringify(context, null, 2)}</pre>
      </div>
    );
  }
}

export default connect()(ContentCreate);
