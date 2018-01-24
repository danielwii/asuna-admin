/* eslint-disable indent,function-paren-newline */
import React  from 'react';
import * as R from 'ramda';

import {
  Button,
  Checkbox,
  DatePicker,
  Form,
  Icon,
  Input,
  InputNumber,
  Select,
  Switch,
  TimePicker,
}                          from 'antd';
// import { BraftRichEditor } from '../RichEditor';
import { createLogger }    from '../../adapters/logger';
import { BraftRichEditor } from '../../components/RichEditor';

const logger = createLogger('components:dynamic-form:elements');

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
// //   logger.info('generate', key, name);
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
export const generatePlain = ({ key, label, text }, formItemLayout = defaultFormItemLayout) => {
  logger.info('generatePlain', key, label, text);
  return <Form.Item key={key || label} {...formItemLayout} label={label}>{text}</Form.Item>;
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
  logger.info('generateHidden', key, name);
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
  logger.info('generateCheckbox', key, name);
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
  logger.info('generateButton', key, name);
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

export const generateInputNumber = (form, {
  key, name, label,
}, formItemLayout = defaultFormItemLayout) => {
  logger.info('generateInputNumber', key, name);
  const fieldName = key || name;
  const labelName = label || name || key;
  return generateComponent(
    form,
    { fieldName, labelName },
    <InputNumber />,
    formItemLayout,
  );
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
  logger.info('generateDateTime', key, name);
  const fieldName = key || name;
  const labelName = label || name || key;

  if (mode === 'time') {
    return generateComponent(
      form, { fieldName, labelName }, (
        <TimePicker />
      ), formItemLayout,
    );
  } else if (mode === 'date') {
    return generateComponent(
      form, { fieldName, labelName }, (
        <DatePicker />
      ), formItemLayout,
    );
  }
  return generateComponent(
    form, { fieldName, labelName }, (
      <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" />
    ), formItemLayout,
  );
};

export const generateSwitch = (form, {
  key, name, label,
}, formItemLayout = defaultFormItemLayout) => {
  const fieldName = key || name;
  const labelName = label || name || key;
  return generateComponent(
    form, { fieldName, labelName, rules: { valuePropName: 'checked' } }, (
      <Switch />
    ), formItemLayout,
  );
};

export const generateRichTextEditor = (form, {
  key, name, label, auth,
}, formItemLayout = defaultFormItemLayout) => {
  const fieldName = key || name;
  const labelName = label || name || key;
  return generateComponent(
    form, { fieldName, labelName }, (
      <BraftRichEditor auth={auth} />
    ), formItemLayout,
  );
};

export const generateAssociation = (form, {
  key, name, label, placeholder, onChange, onFocus, onBlur, items,
  getName = R.prop('name'), getValue = R.prop('value'),
}, formItemLayout = defaultFormItemLayout) => {
  const fieldName = key || name;
  const labelName = label || name || key;
  return generateComponent(
    form, { fieldName, labelName }, (
      <Select
        key={fieldName}
        showSearch
        style={{ width: 200 }}
        placeholder={placeholder}
        optionFilterProp="items"
        // onChange={onChange}
        // onFocus={onFocus}
        // onBlur={onBlur}
        filterOption={(input, option) => {
          logger.log('filter input is', input, 'option is', option);
          return option.props.items.toLowerCase().indexOf(input.toLowerCase()) >= 0;
        }}
      >
        {(items || []).map(item => (
          <Select.Option key={getValue(item)} value={getValue(item)}>{getName(item)}</Select.Option>
        ))}
      </Select>
    ), formItemLayout,
  );
};
