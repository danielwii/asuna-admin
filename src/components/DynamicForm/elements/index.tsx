import React from 'react';

import { Checkbox, DatePicker, Form, Icon, Input, InputNumber, Switch, TimePicker } from 'antd';
import { GetFieldDecoratorOptions, WrappedFormUtils } from 'antd/es/form/Form';

import { BraftRichEditor } from '../../RichEditor';

import { ImagesUploader } from '../Images';
import { VideoUploader } from '../Videos';
import { Authorities } from '../Authorities';

import { Config } from '@asuna-admin/config';
import { createLogger } from '@asuna-admin/logger';

const logger = createLogger('components:dynamic-form:elements', 'warn');

export interface IFormItemLayout {
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

export type PlainOptions = {
  key: string;
  label: string;
  text?: string;
  help?: string;
};

export const generatePlain = (
  options: PlainOptions,
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

type ComponentOptions = {
  key?: string;
  name?: string;
  label?: string;
  fieldName: string;
  labelName: string;
  opts?: GetFieldDecoratorOptions;
  help?: string;
};

export const generateComponent = (
  form: WrappedFormUtils,
  options: ComponentOptions,
  Component: React.ReactNode,
  formItemLayout: IFormItemLayout = {},
) => {
  const { fieldName, labelName, opts, help } = options;
  if (fieldName) {
    logger.debug('[generateComponent]', options);
    const decorator = form.getFieldDecorator(fieldName, opts || {});
    return (
      <Form.Item key={fieldName} {...formItemLayout} label={labelName || fieldName} help={help}>
        {decorator(Component)}
      </Form.Item>
    );
  }
  return null;
};

export type HiddenOptions = { key: string; name: string };

export const generateHidden = (form: WrappedFormUtils, options: HiddenOptions) => {
  logger.debug('generateHidden', options);
  const { key, name } = options;
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

export const generateCheckbox = (
  form: WrappedFormUtils,
  options,
  formItemLayout?: IFormItemLayout,
) => {
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
  form: WrappedFormUtils,
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

export type InputOptions = {
  key: string;
  name: string;
  label: string;
  required: boolean;
  requiredMessage: string;
  placeholder: string;
  iconType: string;
  help: string;
  length: number;
};

export const generateInput = (
  form: WrappedFormUtils,
  {
    key,
    name,
    label,
    required = false,
    requiredMessage,
    placeholder = '',
    iconType,
    help,
    length,
  }: InputOptions,
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
      key,
      name,
      label,
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

export const generateTextArea = (
  form: WrappedFormUtils,
  options,
  formItemLayout?: IFormItemLayout,
) => {
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
  form: WrappedFormUtils,
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
  form: WrappedFormUtils,
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
  form: WrappedFormUtils,
  options,
  formItemLayout: IFormItemLayout = defaultFormItemLayout,
) => {
  const { key, name, label, auth } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  const host = Config.get('IMAGE_HOST');
  const prefix = Config.get('IMAGE_PREFIX');
  const handler = Config.get('IMAGE_RES_HANDLER');
  return generateComponent(
    form,
    { fieldName, labelName, ...options },
    <ImagesUploader many={true} auth={auth} host={host} prefix={prefix} urlHandler={handler} />,
    formItemLayout,
  );
};

export const generateImage = (
  form: WrappedFormUtils,
  options,
  formItemLayout: IFormItemLayout = defaultFormItemLayout,
) => {
  const { key, name, label, auth } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  const host = Config.get('IMAGE_HOST');
  const prefix = Config.get('IMAGE_PREFIX');
  const handler = Config.get('IMAGE_RES_HANDLER');
  return generateComponent(
    form,
    { fieldName, labelName, ...options },
    <ImagesUploader many={false} auth={auth} host={host} prefix={prefix} urlHandler={handler} />,
    formItemLayout,
  );
};

export const generateVideo = (
  form: WrappedFormUtils,
  options,
  formItemLayout: IFormItemLayout = defaultFormItemLayout,
) => {
  const { key, name, label } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  const host = Config.get('VIDEO_HOST');
  const prefix = Config.get('VIDEO_PREFIX');
  const handler = Config.get('VIDEO_RES_HANDLER');
  return generateComponent(
    form,
    { fieldName, labelName, ...options },
    <VideoUploader host={host} prefix={prefix} urlHandler={handler} />,
    formItemLayout,
  );
};

export const generateAuthorities = (
  form: WrappedFormUtils,
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
  form: WrappedFormUtils,
  options,
  formItemLayout: IFormItemLayout = defaultFormItemLayout,
) => {
  const { key, name, label } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  const host = Config.get('ATTACHES_HOST');
  const prefix = Config.get('ATTACHES_PREFIX');
  const handler = Config.get('ATTACHES_RES_HANDLER');
  return generateComponent(
    form,
    { fieldName, labelName, ...options },
    <BraftRichEditor host={host} prefix={prefix} urlHandler={handler} />,
    formItemLayout,
  );
};
