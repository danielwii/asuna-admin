import React from 'react';

import { Checkbox, DatePicker, Form, Icon, Input, InputNumber, Switch, TimePicker } from 'antd';

import { BraftRichEditor } from '../../RichEditor';

import { ImagesUploader, ImageUploader } from '../images';
import { VideoUploader } from '../videos';
import { Authorities } from '../authorities';
import { createLogger, lv } from '../../../helpers/index';
import { config } from '../../../app/configure';

const logger = createLogger('components:dynamic-form:elements', 'warn');

interface IFormItemLayout {
  labelCol?: { offset?: number; span?: number };
  wrapperCol?: { offset?: number; span?: number };
}

const defaultFormItemLayout: IFormItemLayout = {};

const horizontalFormItemLayout: IFormItemLayout = {
  labelCol: { offset: 0, span: 5 },
  wrapperCol: { offset: 0, span: 19 },
};

// --------------------------------------------------------------
// # Component Generator Template
//
// export const generate = (form, {
//   key, name, label,
// }, formItemLayout: IFormItemLayout = defaultFormItemLayout) => {
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

export const generatePlain = (
  options,
  formItemLayout: IFormItemLayout = horizontalFormItemLayout,
) => {
  const { key, label, text, help } = options;
  logger.log('[generatePlain]', options);
  const fieldName = key || name;
  const labelName = label || name || key;
  return (
    <Form.Item key={fieldName} {...formItemLayout} label={labelName} help={help}>
      {text}
    </Form.Item>
  );
};

export const generateComponent = (
  form,
  options,
  Component,
  formItemLayout: IFormItemLayout = {},
) => {
  const { fieldName, labelName = fieldName, opts = {}, help } = options;
  if (fieldName) {
    logger.debug('[generateComponent]', options);
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
  logger.debug('generateHidden', key, name);
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

export const generateCheckbox = (form, options, formItemLayout?: IFormItemLayout) => {
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

export const generateInputNumber = (
  form,
  options,
  formItemLayout: IFormItemLayout = defaultFormItemLayout,
) => {
  const { key, name, label } = options;
  logger.debug('[generateInputNumber]', options);
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
  formItemLayout?: IFormItemLayout,
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

export const generateTextArea = (form, options, formItemLayout?: IFormItemLayout) => {
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
export const generateDateTime = (
  form,
  options,
  formItemLayout: IFormItemLayout = defaultFormItemLayout,
) => {
  const { key, name, label, mode = '' } = options;
  logger.debug('[generateDateTime]', options);
  const fieldName = key || name;
  const labelName = label || name || key;

  if (mode === 'time') {
    return generateComponent(
      form,
      { fieldName, labelName, ...options },
      <TimePicker />,
      formItemLayout,
    );
  }
  if (mode === 'date') {
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

export const generateSwitch = (
  form,
  options,
  formItemLayout: IFormItemLayout = defaultFormItemLayout,
) => {
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

export const generateImages = (
  form,
  options,
  formItemLayout: IFormItemLayout = defaultFormItemLayout,
) => {
  const { key, name, label, auth } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  const host = config.get('IMAGE_HOST');
  const prefix = config.get('IMAGE_PREFIX');
  const handler = config.get('IMAGE_RES_HANDLER');
  return generateComponent(
    form,
    { fieldName, labelName, ...options },
    <ImagesUploader auth={auth} host={host} prefix={prefix} urlHandler={handler} />,
    formItemLayout,
  );
};

export const generateImage = (
  form,
  options,
  formItemLayout: IFormItemLayout = defaultFormItemLayout,
) => {
  const { key, name, label, auth } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  const host = config.get('IMAGE_HOST');
  const prefix = config.get('IMAGE_PREFIX');
  const handler = config.get('IMAGE_RES_HANDLER');
  return generateComponent(
    form,
    { fieldName, labelName, ...options },
    <ImageUploader auth={auth} host={host} prefix={prefix} urlHandler={handler} />,
    formItemLayout,
  );
};

export const generateVideo = (
  form,
  options,
  formItemLayout: IFormItemLayout = defaultFormItemLayout,
) => {
  const { key, name, label, auth } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  const host = config.get('VIDEO_HOST');
  const prefix = config.get('VIDEO_PREFIX');
  const handler = config.get('VIDEO_RES_HANDLER');
  return generateComponent(
    form,
    { fieldName, labelName, ...options },
    <VideoUploader auth={auth} host={host} prefix={prefix} urlHandler={handler} />,
    formItemLayout,
  );
};

export const generateAuthorities = (
  form,
  options,
  formItemLayout: IFormItemLayout = defaultFormItemLayout,
) => {
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

export const generateRichTextEditor = (
  form,
  options,
  formItemLayout: IFormItemLayout = defaultFormItemLayout,
) => {
  const { key, name, label, auth } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  const host = config.get('ATTACHES_HOST');
  const prefix = config.get('ATTACHES_PREFIX');
  const handler = config.get('ATTACHES_RES_HANDLER');
  return generateComponent(
    form,
    { fieldName, labelName, ...options },
    <BraftRichEditor auth={auth} host={host} prefix={prefix} urlHandler={handler} />,
    formItemLayout,
  );
};
