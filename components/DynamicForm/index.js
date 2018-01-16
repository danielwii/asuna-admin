import React     from 'react';
import PropTypes from 'prop-types';
import _         from 'lodash';

import { Card, Form } from 'antd';

import {
  generateButton, generateCheckbox, generateDateTime, generateHidden, generateInput,
  generateInputNumber, generatePlain, generateTextArea, generateSwitch,
} from './elements';

// FIXME remove it
export const buildForm = (form, definitions) => definitions.map((definition) => {
  switch (definition.type) {
    case 'Input': {
      return generateInput(form, definition.config, definition.layout);
    }
    default:
      console.warn(`build form for type ${definition.type} not implemented.`);
  }
  return definition;
});

// FIXME remove it
class DynamicForm extends React.Component {
  static propTypes = {
    definitions: PropTypes.arrayOf(PropTypes.shape({})),
  };

  render() {
    const { form, definitions } = this.props;
    return (
      <div>
        <h1>Dynamic form</h1>
        <hr />
        {buildForm(form, definitions)}
      </div>
    );
  }
}

export default Form.create()(DynamicForm);

export const DynamicFormTypes = {
  Input      : 'Input',
  Checkbox   : 'Checkbox',
  Button     : 'Button',
  Hidden     : 'Hidden',
  Plain      : 'Plain',
  InputNumber: 'InputNumber',
  TextArea   : 'TextArea',
  DateTime   : 'DateTime',
  Switch     : 'Switch',
};

export class DynamicForm2 extends React.Component {
  static propTypes = {
    fields: PropTypes.shape({}),
  };

  constructor(props) {
    super(props);

    this.buildField = this.buildField.bind(this);
  }

  buildField(field, index) {
    console.log('DynamicForm2 build field', field, 'field index is', index);

    const { form } = this.props;
    const options  = { ...field.options, key: field.key || field.name, name: field.name };

    switch (field.type) {
      case DynamicFormTypes.Plain:
        return generatePlain({ label: options.name, text: field.value });
      case DynamicFormTypes.Input:
        return generateInput(form, options);
      case DynamicFormTypes.Checkbox:
        return generateCheckbox(form, options);
      case DynamicFormTypes.Button:
        return generateButton(form, options);
      case DynamicFormTypes.Hidden:
        return generateHidden(form, options);
      case DynamicFormTypes.InputNumber:
        return generateInputNumber(form, options);
      case DynamicFormTypes.TextArea:
        return generateTextArea(form, options);
      case DynamicFormTypes.DateTime:
        return generateDateTime(form, options);
      case DynamicFormTypes.Switch:
        return generateSwitch(form, options);
      default:
        return <div>DynamicForm2 `{field.type}-{options.type}-{options.key}` not implemented.</div>;
    }
  }

  buildFieldGroup = (fieldGroup, index) => {
    console.log('DynamicForm2 build field group', fieldGroup, 'group index is', index);
    return (
      <div>
        <Card key={index}>
          {_.map(fieldGroup, this.buildField)}
          {/* language=CSS */}
        </Card>
        <style jsx>{`
          div {
            margin-bottom: .5rem;
          }
        `}
        </style>
      </div>
    );
  };

  render() {
    const { fields } = this.props;
    console.log('DynamicForm2 props is', this.props, 'fields is', fields);

    /*
        const fieldGroups = R.compose(
          R.groupBy(R.pipe(R.prop('key'), R.split(/-/), arr => arr[0])),
          R.values,
        )(fields);
        const fieldGroup s= _.groupBy(fields, (field, key) => _.split(_.get(field, 'key'), '-'));
        console.log('DynamicForm2 fields group is', fieldGroups);
    */

    return (
      <Form>
        {/* {_.map(fieldGroups, this.buildFieldGroup)} */}
        {_.map(fields, this.buildField)}
      </Form>
    );
  }
}
