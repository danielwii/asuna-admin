import { Form } from '@ant-design/compatible';
import { GetFieldDecoratorOptions, WrappedFormUtils } from '@ant-design/compatible/es/form/Form';
import { FIELD_DATA_PROP } from '@ant-design/compatible/lib/form/constants';
import { BraftRichEditor } from '@asuna-admin/components/RichEditor';
import { Config } from '@asuna-admin/config';
import { createLogger } from '@asuna-admin/logger';

import { Checkbox, DatePicker, Input, InputNumber, Switch, TimePicker } from 'antd';
import { StringTmpl, WithVariable } from 'asuna-components';
import * as _ from 'lodash';
import * as React from 'react';
import JSONInput from 'react-json-editor-ajrm';
import locale from 'react-json-editor-ajrm/locale/zh-cn';
import { useLogger } from 'react-use';

import { Authorities } from '../Authorities';
import { VideoUploader } from '../Videos';
import { FormComponentProps } from './interfaces';

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
  opts?: GetFieldDecoratorOptions;
  help?: string;
  extra?: React.ReactNode;
};

export const generateComponent = (
  form: WrappedFormUtils,
  options: ComponentOptions,
  Component: React.ReactNode,
  formItemLayout: IFormItemLayout = horizontalFormItemLayout,
) => {
  const { fieldName, labelName, opts, help } = options;
  if (fieldName) {
    logger.debug('[generateComponent]', options);
    const decorator = form.getFieldDecorator(fieldName, opts || {});
    return (
      <Form.Item
        key={fieldName}
        {...formItemLayout}
        label={labelName || fieldName}
        {...(help ? { help: <div dangerouslySetInnerHTML={{ __html: help }} /> } : null)}
        extra={options.extra}
      >
        {decorator(Component)}
      </Form.Item>
    );
  }
  return null;
};

export type HiddenOptions = { key: string; name: string };

export const generateHidden = (form: WrappedFormUtils, options: HiddenOptions) => {
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

export const generateCheckbox = (form: WrappedFormUtils, options, formItemLayout?: IFormItemLayout) => {
  const { key, name, label } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  return generateComponent(form, { fieldName, labelName, ...options }, <Checkbox />, formItemLayout);
};

export const generateInputNumber = (
  form: WrappedFormUtils,
  options,
  formItemLayout: IFormItemLayout = horizontalFormItemLayout,
) => {
  const { key, name, label } = options;
  logger.debug('[generateInputNumber]', options);
  const fieldName = key || name;
  const labelName = label || name || key;
  return generateComponent(form, { fieldName, labelName, ...options }, <InputNumber />, formItemLayout);
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
  form: WrappedFormUtils,
  { key, name, label, required = false, requiredMessage, placeholder = '', iconType, help, length }: InputOptions,
  formItemLayout?: IFormItemLayout,
) => {
  const fieldName = key || name;
  const labelName = label || name || key;

  let component;
  if (iconType) {
    component = (
      <Input
        // prefix={<Icon type={iconType} style={{ color: 'rgba(0,0,0,.25)' }} />}
        placeholder={placeholder}
        allowClear
      />
    );
  } else {
    component = <Input placeholder={placeholder} allowClear />;
  }

  const opts = { rules: [{ required, message: requiredMessage }, { max: length }] };
  return generateComponent(form, { key, name, label, fieldName, labelName, opts, help }, component, formItemLayout);
};

const TextAreaHOC: React.FC<Partial<FormComponentProps>> = (props) => (
  <WithVariable key={props.id} variable={props as FormComponentProps}>
    {(props) => {
      const value = _.isObject(props.value) ? JSON.stringify(props.value) : props.value;
      const textArea = <Input.TextArea autoSize={{ minRows: 3 }} allowClear {...props} value={value} />;
      if (props[FIELD_DATA_PROP].type === 'JSON') {
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
        /*
        return (
          <Row gutter={4}>
            <Col>
              <JSONInput
                id={`${props.id}_json_input`}
                locale={locale}
                height="15rem"
                width="100%"
                onChange={({ json, jsObject }) => jsObject && props.onChange(json)}
                placeholder={_.isString(props.value) ? JSON.parse(props.value) : props.value ?? {}}
              />
              <Divider type="horizontal" dashed style={{ margin: '0.5rem 0' }} />
            </Col>
            <Col>
              <Preview text={_.isString(props.value) ? props.value : JSON.stringify(props.value)} jsonMode />
            </Col>
          </Row>
        );
*/
      }
      return textArea;
    }}
  </WithVariable>
);

export const generateTextArea = (form: WrappedFormUtils, options, formItemLayout?: IFormItemLayout) => {
  const { key, name, label } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  return generateComponent(form, { fieldName, labelName, ...options }, <TextAreaHOC />, formItemLayout);
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
        useLogger('generateStringTmpl', props);
        return (
          <StringTmpl
            tmpl={props.value}
            fields={props[FIELD_DATA_PROP]?.options?.fields}
            {...props}
            {...props[FIELD_DATA_PROP]?.options?.extra}
          />
        );
      }}
    </WithVariable>
  );
};

export const generateStringTmpl = (form: WrappedFormUtils, options, formItemLayout?: IFormItemLayout) => {
  const { key, name, label } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  return generateComponent(form, { fieldName, labelName, ...options }, <StringTmplHOC />, formItemLayout);
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
  formItemLayout: IFormItemLayout = horizontalFormItemLayout,
) => {
  const { key, name, label, mode = '' } = options;
  logger.debug('[generateDateTime]', options);
  const fieldName = key || name;
  const labelName = label || name || key;

  if (mode === 'time') {
    return generateComponent(form, { fieldName, labelName, ...options }, <TimePicker />, formItemLayout);
  }
  if (mode === 'date') {
    return generateComponent(form, { fieldName, labelName, ...options }, <DatePicker />, formItemLayout);
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
  formItemLayout: IFormItemLayout = horizontalFormItemLayout,
) => {
  const { key, name, label, readonly } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  return generateComponent(
    form,
    { fieldName, labelName, opts: { valuePropName: 'checked' }, ...options },
    <Switch disabled={readonly} />,
    formItemLayout,
  );
};

export const generateVideo = (
  form: WrappedFormUtils,
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
    <VideoUploader urlHandler={handler} />,
    formItemLayout,
  );
};

export const generateAuthorities = (
  form: WrappedFormUtils,
  options,
  formItemLayout: IFormItemLayout = horizontalFormItemLayout,
) => {
  const { key, name, label } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  return generateComponent(form, { fieldName, labelName, ...options }, <Authorities />, formItemLayout);
};

export const generateRichTextEditor = (
  form: WrappedFormUtils,
  options,
  formItemLayout: IFormItemLayout = horizontalFormItemLayout,
) => {
  const { key, name, label } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  // const host = Config.get('ATTACHE_HOST');
  const handler = Config.get('ATTACHE_RES_HANDLER');
  return generateComponent(
    form,
    { fieldName, labelName, ...options },
    <BraftRichEditor urlHandler={handler} />,
    formItemLayout,
  );
};
