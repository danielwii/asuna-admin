/** @jsxRuntime classic */

/** @jsx jsx */
// noinspection ES6UnusedImports
import { css, jsx } from '@emotion/react';

import { WithVariable } from '@danielwii/asuna-components/dist/helper/helper';
import { StringTmpl } from '@danielwii/asuna-components/dist/string-tmpl';

import { Checkbox, DatePicker, Input, InputNumber, Switch, TimePicker, Form, FormInstance } from 'antd';
import * as _ from 'lodash';
import dynamic from 'next/dynamic';
import React, { FunctionComponent, VoidFunctionComponent } from 'react';
import JSONInput from 'react-json-editor-ajrm';
import locale from 'react-json-editor-ajrm/locale/zh-cn';
import { useLogger } from 'react-use';

import { apiProxy } from '../../../adapters/api';
import { Config } from '../../../config';
import { NoSSR } from '../../../helpers/ssr';
import { validateFile } from '../../../helpers/upload';
import { createLogger } from '../../../logger';
import { Authorities } from '../Authorities';
import { VideoUploader } from '../Videos';

import type { FormComponentProps } from './interfaces';

const logger = createLogger('components:dynamic-form:elements');

export interface IFormItemLayout {
  labelCol?: { offset?: number; span?: number };
  wrapperCol?: { offset?: number; span?: number };
}

// export const horizontalFormItemLayout: IFormItemLayout = {};

export const horizontalFormItemLayout: IFormItemLayout = {
  labelCol: { offset: 0, span: 4 },
  wrapperCol: { offset: 0, span: 20 },
};

// --------------------------------------------------------------
// # Component Generator Template
//
// export const generate = (form, {
//   key, name, label,
// }, formItemLayout: IFormItemLayout = horizontalFormItemLayout) => {
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
  name?: string;
  text?: string | React.ReactNode;
  help?: string;
};

export const generatePlain = (options: PlainOptions, formItemLayout: IFormItemLayout = horizontalFormItemLayout) => {
  const { key, name, label, text, help } = options;
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
  opts?: any; // GetFieldDecoratorOptions;
  help?: string;
  extra?: React.ReactNode;
};

export const generateComponent = (
  f,
  options: ComponentOptions,
  Component: VoidFunctionComponent<any>,
  formItemLayout: IFormItemLayout = horizontalFormItemLayout,
) => {
  const form: FormInstance = f.form ? f.form : f;
  const field = f.field ? f.field : f;
  const { fieldName, labelName, opts, help } = options;
  if (fieldName) {
    logger.debug('[generateComponent]', options);
    const name = options.fieldName ?? options.name;
    // const value = form.getFieldValue(name);
    // console.log('<[generateComponent]>', { name, value }, options);
    return (
      <Form.Item
        key={fieldName}
        {...formItemLayout}
        name={name}
        label={labelName || fieldName}
        {...(help ? { help: <div dangerouslySetInnerHTML={{ __html: help }} /> } : null)}
        {...(opts || {})}
        extra={options.extra}
      >
        <Component field={field} />
      </Form.Item>
    );
  }
  return null;
};

export type HiddenOptions = { key: string; name: string };

export const generateHidden = (form: FormInstance, options: HiddenOptions) => {
  logger.debug('[generateHidden]', options);
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

export const generateCheckbox = (form: FormInstance, options, formItemLayout?: IFormItemLayout) => {
  const { key, name, label } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  return generateComponent(form, { fieldName, labelName, ...options }, Checkbox, formItemLayout);
};

export const generateInputNumber = (
  form: FormInstance,
  options,
  formItemLayout: IFormItemLayout = horizontalFormItemLayout,
) => {
  const { key, name, label, required } = options;
  logger.debug('[generateInputNumber]', options);
  const fieldName = key || name;
  const labelName = label || name || key;
  const opts = { rules: [{ required }] };
  return generateComponent(form, { fieldName, labelName, opts, ...options }, InputNumber, formItemLayout);
};

export type InputOptions = {
  key: string;
  name: string;
  label: string;
  required: boolean;
  requiredMessage: string;
  placeholder: string;
  /**
   * @deprecated
   */
  iconType: string;
  help: string;
  length: number;
};

export const generateInput = (
  { form, field, fields }: { form: FormInstance; fields; field },
  options: InputOptions,
  formItemLayout?: IFormItemLayout,
) => {
  const { key, name, label, required = false, requiredMessage, placeholder = '', iconType, help, length } = options;
  const fieldName = key || name;
  const labelName = label || name || key;

  let component;
  if (iconType) {
    component = (props) => (
      <Input
        // prefix={<Icon type={iconType} style={{ color: 'rgba(0,0,0,.25)' }} />}
        placeholder={placeholder}
        allowClear
        {...props}
      />
    );
  } else {
    component = (props) => <Input placeholder={placeholder} allowClear {...props} />;
  }

  const opts = { rules: [{ required, message: requiredMessage }, { max: length || 255 }] };
  return generateComponent(
    { form, field, fields },
    { key, name, label, fieldName, labelName, opts, help },
    component,
    formItemLayout,
  );
};

const TextAreaHOC: React.FC<Partial<FormComponentProps>> = (props) => (
  <WithVariable key={props.id} variable={props as FormComponentProps & { field: any }}>
    {(props) => {
      const value = _.isObject(props.value) ? JSON.stringify(props.value) : props.value;
      const textArea = <Input.TextArea autoSize={{ minRows: 3 }} allowClear {...props} value={value} />;
      // console.log('<[TextAreaHOC]>', props);
      if (props.field.type === 'JSON') {
        return (
          <JSONInput
            id={`${props.id}_json_input`}
            locale={locale}
            height="15rem"
            width="100%"
            onChange={({ json, jsObject }) => jsObject && props.onChange(json)}
            placeholder={_.isString(props.value) ? JSON.parse(props.value) : props.value ?? {}}
          />
        );
      }
      return textArea;
    }}
  </WithVariable>
);

export const generateTextArea = (
  { form, field, fields }: { form: FormInstance; fields; field },
  options,
  formItemLayout?: IFormItemLayout,
) => {
  const { key, name, label } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  return generateComponent({ form, field, fields }, { fieldName, labelName, ...options }, TextAreaHOC, formItemLayout);
};

const StringTmplHOC: React.FC<Partial<FormComponentProps> & Partial<{ fields: any }>> = (props) => {
  useLogger(`StringTmpl`, props);
  return (
    <WithVariable
      key={props.id}
      variable={
        props as FormComponentProps<
          string,
          {
            fields: { name: string; help?: string; fake?: string }[];
            extra?: { jsonMode: true } | { language: string };
          }
        >
      }
    >
      {(props) => {
        useLogger('StringTmpl.generateStringTmpl', props);
        // fixme FIELD_DATA_PROP not implemented
        return (
          <StringTmpl
            tmpl={props.value}
            fields={props['FIELD_DATA_PROP']?.options?.fields}
            {...props}
            {...props['FIELD_DATA_PROP']?.options?.extra}
          />
        );
      }}
    </WithVariable>
  );
};

export const generateStringTmpl = (form: FormInstance, options, formItemLayout?: IFormItemLayout) => {
  const { key, name, label } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  return generateComponent(form, { fieldName, labelName, ...options }, StringTmplHOC, formItemLayout);
};

/**
 * @param form
 * @param options
 * @param formItemLayout
 * @returns {null}
 */
export const generateDateTime = (
  form: FormInstance,
  options,
  formItemLayout: IFormItemLayout = horizontalFormItemLayout,
) => {
  const { key, name, label, mode = '' } = options;
  logger.debug('[generateDateTime]', options);
  const fieldName = key || name;
  const labelName = label || name || key;

  if (mode === 'time') {
    return generateComponent(
      form,
      { fieldName, labelName, ...options },
      (props) => <TimePicker {...props} />,
      formItemLayout,
    );
  }
  if (mode === 'date') {
    return generateComponent(
      form,
      { fieldName, labelName, ...options },
      (props) => <DatePicker {...props} />,
      formItemLayout,
    );
  }
  return generateComponent(
    form,
    { fieldName, labelName, ...options },
    (props) => <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" {...props} />,
    formItemLayout,
  );
};

export const generateSwitch = (
  form: FormInstance,
  options,
  formItemLayout: IFormItemLayout = horizontalFormItemLayout,
) => {
  const { key, name, label, readonly } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  return generateComponent(
    form,
    { fieldName, labelName, opts: { valuePropName: 'checked' }, ...options },
    (props) => <Switch disabled={readonly} {...props} />,
    formItemLayout,
  );
};

export const generateVideo = (
  form: FormInstance,
  options,
  formItemLayout: IFormItemLayout = horizontalFormItemLayout,
) => {
  const { key, name, label } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  // const host = Config.get('VIDEO_HOST');
  const handler = Config.get('VIDEO_RES_HANDLER');
  return generateComponent(
    form,
    { fieldName, labelName, ...options },
    (props) => <VideoUploader urlHandler={handler} {...props} />,
    formItemLayout,
  );
};

export const generateAuthorities = (
  form: FormInstance,
  options,
  formItemLayout: IFormItemLayout = horizontalFormItemLayout,
) => {
  const { key, name, label } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  return generateComponent(
    form,
    { fieldName, labelName, ...options },
    (props) => <Authorities {...props} />,
    formItemLayout,
  );
};

const RichEditor = dynamic(() => import('@danielwii/asuna-components/dist/rich-editor'), { ssr: false });

export const generateRichTextEditor = (
  form: FormInstance,
  options,
  formItemLayout: IFormItemLayout = horizontalFormItemLayout,
) => {
  const { key, name, label } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  // const host = Config.get('ATTACHE_HOST');
  // const handler = Config.get('ATTACHE_RES_HANDLER');
  // const RichEditor = require('@danielwii/asuna-components/dist/rich-editor').RichEditor;
  // const RichEditor = require('@danielwii/asuna-components/dist/rich-editor').RichEditor;
  return generateComponent(
    form,
    { fieldName, labelName, ...options },
    (props) => (
      // <NoSSR fallback={<Loading type="chase" />}>
      <div
        key={fieldName}
        css={css`
          line-height: 20px;
        `}
      >
        {typeof window !== 'undefined' && (
          <RichEditor {...props} upload={apiProxy.upload} /*validateFn={validateFile}*/ />
        )}
        {/*<RichEditor {...props} upload={apiProxy.upload} validateFn={validateFile} />*/}
      </div>
      // </NoSSR>
    ),
    formItemLayout,
  );
};
