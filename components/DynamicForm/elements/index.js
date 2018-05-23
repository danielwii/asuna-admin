/* eslint-disable indent,function-paren-newline */
import React from 'react';

import { Checkbox, DatePicker, Form, Icon, Input, InputNumber, Switch, TimePicker } from 'antd';

import { BraftRichEditor } from '../../../components/RichEditor';

import { ImagesUploader, ImageUploader } from '../images';
import { VideoUploader } from '../videos';
import { Authorities } from '../authorities';
import { createLogger, lv } from '../../../helpers/index';

const logger = createLogger('components:dynamic-form:elements', lv.warn);

const defaultFormItemLayout = {};

const horizontalFormItemLayout = {
  labelCol: { offset: 0, span: 5 },
  wrapperCol: { offset: 0, span: 19 },
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

export const generatePlain = (
  // eslint-disable-next-line react/prop-types
  { key, label, text, help },
  formItemLayout = horizontalFormItemLayout,
) => {
  logger.log('[generatePlain]', { key, label, text, help });
  return (
    <Form.Item
      key={key || label}
      {...formItemLayout}
      label={label}
      help={help}
    >{`${text}`}</Form.Item>
  );
};

export const generateComponent = (form, options, Component, formItemLayout = {}) => {
  const { fieldName, labelName = fieldName, opts = {}, help } = options;
  if (fieldName) {
    logger.info('[generateComponent]', options);
    const decorator = form.getFieldDecorator(fieldName, opts);
    return (
      <Form.Item key={fieldName} {...formItemLayout} label={labelName} help={help}>
        {decorator(Component)}
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
  logger.error('[generateHidden]', 'name is required in generateHidden');
  return null;
};

export const generateCheckbox = (form, options, formItemLayout) => {
  const { key, name, label } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  return generateComponent(
    form,
    { fieldName, labelName, ...options },
    <Checkbox />,
    formItemLayout,
  );
};

export const generateInputNumber = (form, options, formItemLayout = defaultFormItemLayout) => {
  const { key, name, label } = options;
  logger.info('[generateInputNumber]', options);
  const fieldName = key || name;
  const labelName = label || name || key;
  return generateComponent(
    form,
    { fieldName, labelName, ...options },
    <InputNumber />,
    formItemLayout,
  );
};

export const generateInput = (
  form,
  { key, name, label, required = false, requiredMessage, placeholder = '', iconType, help, length },
  formItemLayout,
) => {
  const fieldName = key || name;
  const labelName = label || name || key;

  let component;
  if (iconType) {
    component = (
      <Input
        prefix={<Icon type={iconType} style={{ color: 'rgba(0,0,0,.25)' }} />}
        placeholder={placeholder}
      />
    );
  } else {
    component = <Input placeholder={placeholder} />;
  }

  return generateComponent(
    form,
    {
      fieldName,
      labelName,
      opts: {
        rules: [{ required, message: requiredMessage }, { max: length }],
      },
      help,
    },
    component,
    formItemLayout,
  );
};

export const generateTextArea = (form, options, formItemLayout) => {
  const { key, name, label } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  return generateComponent(
    form,
    { fieldName, labelName, ...options },
    <Input.TextArea />,
    formItemLayout,
  );
};

/**
 * @param form
 * @param options
 * @param formItemLayout
 * @returns {null}
 */
export const generateDateTime = (form, options, formItemLayout = defaultFormItemLayout) => {
  const { key, name, label, mode = '' } = options;
  logger.info('[generateDateTime]', options);
  const fieldName = key || name;
  const labelName = label || name || key;

  if (mode === 'time') {
    return generateComponent(
      form,
      { fieldName, labelName, ...options },
      <TimePicker />,
      formItemLayout,
    );
  } else if (mode === 'date') {
    return generateComponent(
      form,
      { fieldName, labelName, ...options },
      <DatePicker />,
      formItemLayout,
    );
  }
  return generateComponent(
    form,
    { fieldName, labelName, ...options },
    <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" />,
    formItemLayout,
  );
};

export const generateSwitch = (form, options, formItemLayout = defaultFormItemLayout) => {
  const { key, name, label } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  return generateComponent(
    form,
    { fieldName, labelName, opts: { valuePropName: 'checked' }, ...options },
    <Switch />,
    formItemLayout,
  );
};

export const generateImages = (form, options, formItemLayout = defaultFormItemLayout) => {
  const { key, name, label, auth, api } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  return generateComponent(
    form,
    { fieldName, labelName, ...options },
    <ImagesUploader auth={auth} api={api} />,
    formItemLayout,
  );
};

export const generateImage = (form, options, formItemLayout = defaultFormItemLayout) => {
  const { key, name, label, auth, api } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  return generateComponent(
    form,
    { fieldName, labelName, ...options },
    <ImageUploader auth={auth} api={api} />,
    formItemLayout,
  );
};

export const generateVideo = (form, options, formItemLayout = defaultFormItemLayout) => {
  const { key, name, label, auth, api } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  return generateComponent(
    form,
    { fieldName, labelName, ...options },
    <VideoUploader auth={auth} api={api} />,
    formItemLayout,
  );
};

export const generateAuthorities = (form, options, formItemLayout = defaultFormItemLayout) => {
  const { key, name, label } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  return generateComponent(
    form,
    { fieldName, labelName, ...options },
    <Authorities />,
    formItemLayout,
  );
};

export const generateRichTextEditor = (form, options, formItemLayout = defaultFormItemLayout) => {
  const { key, name, label, auth, imageApi } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  return generateComponent(
    form,
    { fieldName, labelName, ...options },
    <BraftRichEditor auth={auth} imageApi={imageApi} />,
    formItemLayout,
  );
};
