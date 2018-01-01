import React     from 'react';
import PropTypes from 'prop-types';
import _         from 'lodash';

import { Form, Icon, Input } from 'antd';

const defaultFormItemLayout = {
  labelCol  : { offset: 0, span: 4 },
  wrapperCol: { offset: 0, span: 12 },
};

// eslint-disable-next-line react/prop-types
export const generatePlain = ({ label, text }, formItemLayout = defaultFormItemLayout) => {
  if (label && text) {
    return <Form.Item {...formItemLayout} label={label}>{text}</Form.Item>;
  }
  return <Form.Item {...formItemLayout} label={label}>{text}</Form.Item>;
};

export const generateInput = (form, {
  key,
  name,
  required = false,
  requiredMessage,
  placeholder = '',
  iconType,
}, formItemLayout = defaultFormItemLayout) => {
  console.log('generateInput', arguments);
  const fieldName = key || name;
  if (name) {
    const decorator = form.getFieldDecorator(fieldName, { rules: [{ required, requiredMessage }] });
    let decorated;
    if (iconType) {
      decorated = decorator(<Input
        prefix={<Icon type={iconType} style={{ color: 'rgba(0,0,0,.25)' }} />}
        placeholder={placeholder}
      />);
    } else {
      decorated = decorator(<Input placeholder={placeholder} />);
    }
    return <Form.Item key={fieldName} {...formItemLayout} label={name}>{decorated}</Form.Item>;
  }
  console.error('name is required in generateInput');
  return null;
};

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
  Input: 'Input',
};

export class DynamicForm2 extends React.Component {
  static propTypes = {
    fields: PropTypes.shape({}),
  };

  constructor(props) {
    super(props);

    this.buildField = this.buildField.bind(this);
  }

  buildField(field, name) {
    console.log('DynamicForm2 build field', field, 'field name is', name);

    const { form } = this.props;

    switch (field.type) {
      case DynamicFormTypes.Input:
        return generateInput(form, { key: name, name: field.name });
      default:
        return <div>`{field.type}` not implemented.</div>;
    }
  }

  render() {
    const { fields } = this.props;
    console.log('DynamicForm2 props is', this.props, 'fields is', fields);

    return (
      <Form>
        {_.map(fields, this.buildField)}
      </Form>
    );
  }
}
