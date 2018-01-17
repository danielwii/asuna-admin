/* eslint-disable indent,function-paren-newline */
import React from 'react';

import {
  Button, Checkbox, DatePicker, Form, Icon, Input, InputNumber, Switch,
  TimePicker,
} from 'antd';

import { createLogger } from '../../adapters/logger';

const logger = createLogger('components:dynamic-form:elements', '-components:dynamic-form:elements:*');

const defaultFormItemLayout = {
  // labelCol  : { offset: 0, span: 4 },
  // wrapperCol: { offset: 0, span: 20 },
};

// --------------------------------------------------------------
// # Component Generator Template
//
// export const generate = (form, {
//   key, name, label,
// }, formItemLayout = defaultFormItemLayout) => {
// //   logger.debug('generate', key, name);
//   const fieldName = key || name;
//   const labelName = label || name || key;
//   if (name) {
//     const decorator = form.getFieldDecorator(fieldName, {});
//     const decorated = decorator(<div></div>);
//     return (
//       <Form.Item key={fieldName} {...formItemLayout} label={labelName}>
//         {decorated}
//       </Form.Item>
//     );
//   }
//   logger.error('name is required in generate');
//   return null;
// };
// --------------------------------------------------------------

// eslint-disable-next-line react/prop-types
export const generatePlain = ({ label, text }, formItemLayout = defaultFormItemLayout) => {
  logger.debug('generatePlain', label, text);
  return <Form.Item {...formItemLayout} label={label}>{text}</Form.Item>;
};

const generateComponent = (form,
                           { fieldName, labelName = fieldName, rules = {} },
                           component,
                           formItemLayout = {}) => {
  if (fieldName) {
    const decorator = form.getFieldDecorator(fieldName, rules);
    return (
      <Form.Item key={fieldName} {...formItemLayout} label={labelName}>
        {decorator(component)}
      </Form.Item>
    );
  }
  return null;
};

export const generateHidden = (form, { key, name }) => {
  logger.debug('generateHidden', key, name);
  const fieldName = key || name;
  if (name) {
    return (
      <Form.Item key={fieldName}>
        <Input type="hidden" />
      </Form.Item>
    );
  }
  logger.error('name is required in generateHidden');
  return null;
};

export const generateCheckbox = (form, {
  key, name, label,
}, formItemLayout) => {
  const fieldName = key || name;
  const labelName = label || name || key;
  return generateComponent(
    form,
    { fieldName, labelName },
    <Checkbox />,
    formItemLayout,
  );
};

/*
export const generateCheckbox2 = (form, {
  key, name, label,
}, formItemLayout = defaultFormItemLayout) => {
  logger.debug('generateCheckbox', key, name);
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
  logger.error('name is required in generateCheckbox');
  return null;
};
*/

// TODO wrap by generateComponent
export const generateButton = (form, {
  key, name, label, type, htmlType, onClick,
}, formItemLayout = defaultFormItemLayout) => {
  logger.debug('generateButton', key, name);
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
  logger.error('name is required in generateButton');
  return null;
};

// TODO wrap by generateComponent
export const generateInputNumber = (form, {
  key, name, label,
}, formItemLayout = defaultFormItemLayout) => {
  logger.debug('generateInputNumber', key, name);
  const fieldName = key || name;
  if (name) {
    return (
      <Form.Item key={fieldName} {...formItemLayout} label={label || name || key}>
        <InputNumber />
      </Form.Item>
    );
  }
  logger.error('name is required in generateInputNumber');
  return null;
};

export const generateInput = (form, {
  key, name, label,
  required = false, requiredMessage,
  placeholder = '',
  iconType,
}, formItemLayout) => {
  const fieldName = key || name;
  const labelName = label || name || key;

  let component;
  if (iconType) {
    component = (<Input
      prefix={<Icon type={iconType} style={{ color: 'rgba(0,0,0,.25)' }} />}
      placeholder={placeholder}
    />);
  } else {
    component = (<Input placeholder={placeholder} />);
  }

  return generateComponent(
    form,
    { fieldName, labelName, rules: [{ required, requiredMessage }] },
    component,
    formItemLayout,
  );
};

export const generateTextArea = (form, { key, name, label }, formItemLayout) => {
  const fieldName = key || name;
  const labelName = label || name || key;
  return generateComponent(
    form, { fieldName, labelName }, (
      <Input.TextArea />
    ), formItemLayout,
  );
};

/**
 * TODO wrap by generateComponent
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
  logger.debug('generateDateTime', key, name);
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

  logger.error('name is required in generateDateTime');
  return null;
};

// TODO wrap by generateComponent
export const generateSwitch = (form, {
  key, name, label,
}, formItemLayout = defaultFormItemLayout) => {
  logger.debug('generateSwitch', key, name);
  const fieldName = key || name;
  const labelName = label || name || key;
  if (name) {
    return (
      <Form.Item key={fieldName} {...formItemLayout} label={labelName}>
        <Switch />
      </Form.Item>
    );
  }
  logger.error('name is required in generateSwitch');
  return null;
};
