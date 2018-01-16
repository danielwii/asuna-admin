import React from 'react';

import { Button, Checkbox, Form, Icon, Input, InputNumber, DatePicker, TimePicker, Switch } from 'antd';

const defaultFormItemLayout = {
  // labelCol  : { offset: 0, span: 4 },
  // wrapperCol: { offset: 0, span: 20 },
};

// export const generate = (form, {
//   key, name, label,
// }, formItemLayout = defaultFormItemLayout) => {
//   console.log('generate', key, name);
//   const fieldName = key || name;
//   const labelName = label || name || key;
//   if (name) {
//     return (
//       <Form.Item key={fieldName} {...formItemLayout} label={labelName}>
//       </Form.Item>
//     );
//   }
//   console.error('name is required in generate');
//   return null;
// };

// eslint-disable-next-line react/prop-types
export const generatePlain = ({ label, text }, formItemLayout = defaultFormItemLayout) => {
  console.log('generatePlain', label, text);
  return <Form.Item {...formItemLayout} label={label}>{text}</Form.Item>;
};

/**
 * @param form
 * @param key
 * @param name
 * @param required
 * @param requiredMessage
 * @param placeholder
 * @param iconType
 * @param label
 * @param formItemLayout
 * @returns {*}
 */
export const generateInput = (form, {
  key, name, label,
  required = false, requiredMessage,
  placeholder = '',
  iconType,
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

export const generateHidden = (form, { key, name }) => {
  console.log('generateHidden', key, name);
  const fieldName = key || name;
  if (name) {
    return (
      <Form.Item key={fieldName}>
        <Input type="hidden" />
      </Form.Item>
    );
  }
  console.error('name is required in generateHidden');
  return null;
};

export const generateCheckbox = (form, {
  key, name, label,
}, formItemLayout = defaultFormItemLayout) => {
  console.log('generateCheckbox', key, name);
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
  console.log('generateButton', key, name);
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

export const generateInputNumber = (form, {
  key, name, label,
}, formItemLayout = defaultFormItemLayout) => {
  console.log('generateInputNumber', key, name);
  const fieldName = key || name;
  if (name) {
    return (
      <Form.Item key={fieldName} {...formItemLayout} label={label || name || key}>
        <InputNumber />
      </Form.Item>
    );
  }
  console.error('name is required in generateInputNumber');
  return null;
};

export const generateTextArea = (form, {
  key, name, label,
}, formItemLayout = defaultFormItemLayout) => {
  console.log('generateInputNumber', key, name);
  const fieldName = key || name;
  if (name) {
    return (
      <Form.Item key={fieldName} {...formItemLayout} label={label || name || key}>
        <Input.TextArea />
      </Form.Item>
    );
  }
  console.error('name is required in generateInputNumber');
  return null;
};

/**
 *
 * @param form
 * @param key
 * @param name
 * @param label
 * @param mode - '' || date || time
 * @param formItemLayout
 * @returns {null}
 */
export const generateDateTime = (form, {
  key, name, label,
  mode = '',
}, formItemLayout = defaultFormItemLayout) => {
  console.log('generateDateTime', key, name);
  const fieldName = key || name;
  const labelName = label || name || key;

  if (name) {
    let datePicker;
    let timePicker;

    if (mode === '' || mode === 'date') {
      datePicker = <DatePicker />;
    }

    if (mode === '' || mode === 'time') {
      timePicker = <TimePicker />;
    }
    return (
      <Form.Item key={fieldName} {...formItemLayout} label={labelName}>
        {datePicker}{timePicker}
      </Form.Item>
    );
  }

  console.error('name is required in generateDateTime');
  return null;
};

export const generateSwitch = (form, {
  key, name, label,
}, formItemLayout = defaultFormItemLayout) => {
  console.log('generateSwitch', key, name);
  const fieldName = key || name;
  const labelName = label || name || key;
  if (name) {
    return (
      <Form.Item key={fieldName} {...formItemLayout} label={labelName}>
        <Switch />
      </Form.Item>
    );
  }
  console.error('name is required in generateSwitch');
  return null;
};
