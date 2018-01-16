import React     from 'react';
import PropTypes from 'prop-types';
import _         from 'lodash';

import { Button, Card, Checkbox, Form, Icon, Input } from 'antd';

const defaultFormItemLayout = {
  // labelCol  : { offset: 0, span: 4 },
  // wrapperCol: { offset: 0, span: 20 },
};

// eslint-disable-next-line react/prop-types
export const generatePlain = ({ label, text }, formItemLayout = defaultFormItemLayout) => {
  if (label && text) {
    return <Form.Item {...formItemLayout} label={label}>{text}</Form.Item>;
  }
  return <Form.Item {...formItemLayout} label={label}>{text}</Form.Item>;
};

/**
 * @param form
 * @param key - 标识组件，为定义时采用 name 的值
 * @param name -
 * @param required
 * @param requiredMessage
 * @param placeholder
 * @param iconType
 * @param label
 * @param formItemLayout
 * @returns {*}
 */
export const generateInput = (form, {
  key,
  name,
  required = false,
  requiredMessage,
  placeholder = '',
  iconType,
  label,
}, formItemLayout = defaultFormItemLayout) => {
  console.log('generateInput', key, name, label);
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
    return (
      <Form.Item key={fieldName} {...formItemLayout} label={label || name || key}>
        {decorated}
      </Form.Item>
    );
  }
  console.error('name is required in generateInput');
  return null;
};

export const generateCheckbox = (form, {
  key,
  name,
  label,
}, formItemLayout = defaultFormItemLayout) => {
  console.log('generateCheckbox', arguments);
  const fieldName = key || name;
  if (name) {
    const decorator = form.getFieldDecorator(fieldName, {
      valuePropName: 'checked',
      initialValue : false,
    });
    const decorated = decorator(<Checkbox>{label || name || key}</Checkbox>);
    return (
      <Form.Item key={fieldName} {...formItemLayout}>
        {decorated}
      </Form.Item>
    );
  }
  console.error('name is required in generateCheckbox');
  return null;
};

export const generateButton = (form, {
  key, name, label, type, htmlType, onClick,
}, formItemLayout = defaultFormItemLayout) => {
  console.log('generateButton', arguments);
  const fieldName = key || name;
  if (name) {
    return (
      <Form.Item key={fieldName} {...formItemLayout}>
        <Button
          type={type}
          htmlType={htmlType}
          onClick={() => onClick({ key, name, label })}
        >{label || name || key}
        </Button>
      </Form.Item>
    );
  }
  console.error('name is required in generateButton');
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
  Input   : 'Input',
  Checkbox: 'Checkbox',
  Button  : 'Button',
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
    const options  = { ...field.options, key: field.key, name: field.name };

    switch (field.type) {
      case DynamicFormTypes.Input:
        return generateInput(form, options);
      case DynamicFormTypes.Checkbox:
        return generateCheckbox(form, options);
      case DynamicFormTypes.Button:
        return generateButton(form, options);
      default:
        return <div>DynamicForm2 `{field.type}`-`{field.key}` not implemented.</div>;
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


    // const fieldGroups = R.compose(
    //   R.groupBy(R.pipe(R.prop('key'), R.split(/-/), arr => arr[0])),
    //   R.values,
    // )(fields);
    // const fieldGroup s= _.groupBy(fields, (field, key) => _.split(_.get(field, 'key'), '-'));
    // console.log('DynamicForm2 fields group is', fieldGroups);

    return (
      <Form>
        {/* {_.map(fieldGroups, this.buildFieldGroup)} */}
        {_.map(fields, this.buildField)}
      </Form>
    );
  }
}
