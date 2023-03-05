/** @jsxRuntime classic */

/** @jsx jsx */
// noinspection ES6UnusedImports

import { css, jsx } from '@emotion/react';

import useLogger from '@danielwii/asuna-helper/dist/logger/hooks';

import { Button, Card, Divider, Input, Space, Switch } from 'antd';
import { Promise } from 'bluebird';
import { changeAntdTheme } from 'dynamic-antd-theme';
import { Field, FieldInputProps, FieldProps, Form, FormikErrors, FormikProps, FormikValues, withFormik } from 'formik';
import _ from 'lodash';
import React from 'react';
import { SketchPicker } from 'react-color';
import util from 'util';

import { DebugInfo } from '../debug/debug';
import { WithVariable, isPromiseAlike } from '../helper/helper';
import { AsunaSelect } from '../select/select';
import { StringArray } from '../string-array';
import { StringTmpl } from '../string-tmpl';
import { DynamicJsonArrayTable, ObjectJsonTableHelper } from '../table-helper/dynamic-json-array-table';
import { DefaultFileUploaderAdapterImpl, Uploader } from '../uploader/uploader';
import { FormField, FormFieldDef, FormFieldType, FormFields, UploadFormField } from './interfaces';

import type { WithFormikConfig } from 'formik/dist/withFormik';

interface FormProps<FieldsType> {
  message?: string | React.ReactChild;
  body?: string | React.ReactChild;
  fields: FieldsType;
}

export type FieldRender = (opts: { form; formField: FormField; field; value }) => React.ReactNode;
export interface EasyFormProps extends FormProps<FormFields> {
  initialValues: Record<string, any>;
  customFieldsRender?: Record<string, FieldRender>;
  onSubmit: (values: Record<string, any>) => Promise<any> | any;
  onReset?: () => Promise<any> | any;
  onCancel?: () => Promise<any> | any;
  onClear?: () => Promise<any> | any;
}

const BooleanInput: React.FC<{ fieldDef: FormFieldDef; field: FieldInputProps<any>; value: any }> = React.memo(
  ({ fieldDef, field, value }) => {
    useLogger('[BooleanInput]', fieldDef, field, { value });
    return (
      <React.Fragment>
        <label>{fieldDef.name}</label>
        <Switch
          onChange={(checked: boolean) =>
            field.onChange({ target: { id: field.name, name: field.name, value: checked } })
          }
          defaultChecked={value}
        />
      </React.Fragment>
    );
  },
  (prevProps, nextProps) => prevProps.value === nextProps.value,
);

const UploaderInput: React.FC<{
  fieldDef: FormFieldDef;
  field: FieldInputProps<any>;
  value: any;
  multiple?: boolean;
}> = React.memo(
  ({ fieldDef, field, value, multiple }) => {
    useLogger('*[UploaderInput]*', fieldDef, field, { value });
    const formField = fieldDef.field as UploadFormField;
    return (
      <React.Fragment>
        <label>{field.name}</label>
        <Uploader
          multiple={multiple}
          {...formField.extra}
          adapter={
            formField.extra?.adapter ?? new DefaultFileUploaderAdapterImpl(`${process.env.NEXT_PUBLIC_API_ENDPOINT}`)
          }
          // adapter={fieldDef.field.extra?.adapter ?? new DefaultFileUploaderAdapterImpl()}
          value={value}
          onChange={(newValue: any) =>
            field.onChange({ target: { id: field.name, name: field.name, value: newValue } })
          }
        />
      </React.Fragment>
    );
  },
  (prevProps, nextProps) => prevProps.value === nextProps.value,
);

const SelectInput: React.FC<{
  fieldDef: FormFieldDef;
  field: FieldInputProps<any>;
  label: string;
  value: any;
}> = React.memo(
  ({ fieldDef, field, label, value }) => {
    useLogger('[SelectInput]', fieldDef, field, { label, value });
    return (
      <React.Fragment>
        <label>{label}</label>
        <AsunaSelect
          style={{ width: 240 }}
          placeholder={label}
          {...field}
          items={[]}
          onChange={(value) => field.onChange({ target: { id: name, name, value } })}
          value={value}
          {...fieldDef.field.extra}
        />
      </React.Fragment>
    );
  },
  (prevProps, nextProps) => prevProps.value === nextProps.value,
);

const StringArrayInput: React.FC<{ label: string; field: FieldInputProps<any>; value: any }> = React.memo(
  ({ label, field, value }) => {
    const name = field.name;
    useLogger('[StringArrayInput]', field, { label, value });
    return (
      <React.Fragment>
        <label>{label}</label>
        <StringArray onChange={(value) => field.onChange({ target: { id: name, name, value } })} items={value} />
      </React.Fragment>
    );
  },
  (prevProps, nextProps) => prevProps.value === nextProps.value,
);

const EmailTmplDataInput: React.FC<{
  form: FormikProps<any>;
  label: string;
  field: FieldInputProps<any>;
  value: any;
}> = React.memo(
  ({ form, label, field, value }) => {
    useLogger('[EmailTmplDataInput]', field, { label, value });
    return (
      <React.Fragment>
        <label>{label}</label>
        <DynamicJsonArrayTable
          adapter={ObjectJsonTableHelper}
          value={value}
          preview={(item) => <div>{util.inspect(ObjectJsonTableHelper.keyParser(item))}</div>}
          render={({ fieldOpts, index }) => (
            <Card>
              <Input {...fieldOpts('key', index)} placeholder="key" />
              <Input {...fieldOpts('subject', index)} placeholder="subject" />
              {/* <TextField {...fieldOpts('template', index)} label="template" /> */}
              <WithVariable variable={fieldOpts('template', index)}>
                {({ name, value, onChange }) => (
                  <StringTmpl
                    tmpl={value}
                    fields={[]}
                    onChange={(value) => onChange({ target: { id: name, name, value } } as any)}
                    htmlMode
                  />
                )}
              </WithVariable>
              <pre>{JSON.stringify(field, null, 2)}</pre>
            </Card>
          )}
          onChange={(values) => form.setFieldValue(field.name, values)}
        />
        {/* <DebugInfo data={value} type="util" /> */}
      </React.Fragment>
    );
  },

  (prevProps, nextProps) => prevProps.value === nextProps.value,
);

export const RenderInputComponent: React.FC<{
  form: FormikProps<FormikValues>;
  fieldDef: FormFieldDef;
  field: FieldInputProps<string | number | boolean>;
  value: any;
}> = React.memo(
  ({ form, fieldDef, field, value }) => {
    // useLogger('RenderInputComponent', { fieldDef, field, value });

    const label = field.name === fieldDef.name ? field.name : `${field.name} / ${fieldDef.name}`;

    switch (fieldDef.field.type) {
      case FormFieldType.boolean: {
        return <BooleanInput fieldDef={fieldDef} field={field} value={value} />;
      }
      case FormFieldType.color: {
        return (
          <React.Fragment>
            <label>{field.name}</label>
            <SketchPicker
              css={css`
                margin: 1rem;
              `}
              color={value}
              onChange={(color) => {
                changeAntdTheme(color.hex);
                field.onChange({ target: { id: field.name, name: field.name, value: color } });
              }}
            />
          </React.Fragment>
        );
      }
      case FormFieldType.image: {
        return <UploaderInput fieldDef={fieldDef} field={field} value={value} />;
      }
      case FormFieldType.images: {
        return <UploaderInput multiple fieldDef={fieldDef} field={field} value={value} />;
      }
      case FormFieldType.string: {
        return (
          <React.Fragment>
            <label>{label}</label>
            <Input id={field.name} {...field} value={value} />
          </React.Fragment>
        );
      }
      case FormFieldType.json:
      case FormFieldType.text: {
        return (
          <React.Fragment>
            <label>{label}</label>
            <Input.TextArea id={field.name} {...field} autoSize rows={4} value={value} />
          </React.Fragment>
        );
      }
      case FormFieldType.stringArray: {
        return <StringArrayInput label={label} field={field} value={value} />;
      }
      case FormFieldType.stringTmpl: {
        return (
          <React.Fragment>
            <label>{label}</label>
            <StringTmpl tmpl={value} {...field} fields={[]} {...(fieldDef.field.extra as any)} />
          </React.Fragment>
        );
      }
      case FormFieldType.emailTmplData: {
        return <EmailTmplDataInput form={form} label={label} field={field} value={value} />;
      }
      case FormFieldType.wxTmplData: {
        return (
          <React.Fragment>
            <label>{label}</label>
            <DynamicJsonArrayTable
              adapter={ObjectJsonTableHelper}
              value={value}
              preview={(item) => <div>{util.inspect(ObjectJsonTableHelper.keyParser(item))}</div>}
              render={({ fieldOpts, index }) => (
                <Card>
                  <Input {...fieldOpts('key', index)} placeholder="key" />{' '}
                  <Input {...fieldOpts('color', index)} placeholder="color" />
                  <Input.TextArea {...fieldOpts('value', index)} placeholder="value" autoSize />
                </Card>
              )}
              onChange={(values) => form.setFieldValue(field.name, values)}
            />
            {/* <DebugInfo data={value} type="util" /> */}
          </React.Fragment>
        );
      }
      case FormFieldType.wxSubscribeData: {
        return (
          <React.Fragment>
            <label>{label}</label>
            <DynamicJsonArrayTable
              adapter={ObjectJsonTableHelper}
              value={value}
              preview={(item) => <div>{util.inspect(ObjectJsonTableHelper.keyParser(item))}</div>}
              render={({ fieldOpts, index }) => (
                <Card>
                  <Input {...fieldOpts('key', index)} placeholder="key" />
                  <Input.TextArea {...fieldOpts('value', index)} placeholder="value" autoSize />
                </Card>
              )}
              onChange={(values) => {
                console.log('onChange', field.name, values);
                form.setFieldValue(field.name, values);
              }}
            />
            <DebugInfo data={value} type="util" />
          </React.Fragment>
        );
      }
      case FormFieldType.select: {
        return <SelectInput fieldDef={fieldDef} field={field} label={label} value={value} />;
      }
      default: {
        return (
          <React.Fragment>
            <label>{label}</label>
            <Input id={field.name} type={fieldDef.field.type} {...field} value={value} placeholder={label} />
            {/* <DebugInfo data={{ field, fieldDef, value }} /> */}
          </React.Fragment>
        );
      }
    }
  },
  (prevProps, nextProps) => prevProps.value === nextProps.value,
);

const InnerForm: React.FC<EasyFormProps & FormikProps<FormikValues>> = ({
  isSubmitting,
  message,
  fields,
  handleSubmit,
  handleReset,
  onReset,
  onCancel,
  onClear,
  setValues,
  customFieldsRender,
}) => (
  <Form
    css={css`
      div > label {
        display: block;
        margin: 0.2rem 0.1rem;
        font-weight: bold;
      }
    `}
  >
    {message && <h1>{message}</h1>}
    {_.map(fields, (formField: FormField, key: string) => (
      <Field key={key} name={key}>
        {({ field, form }: FieldProps<string | number | boolean, FormikValues>) => {
          const hasError = !!(form.touched[formField.name] && form.errors[formField.name]);
          const value = field.value ?? formField.defaultValue;
          return (
            <div key={field.name}>
              <div>- {key} -</div>
              {!_.has(customFieldsRender, formField.type) ? (
                <RenderInputComponent
                  form={form}
                  fieldDef={{ field: formField, name: formField.name }}
                  field={field}
                  value={value}
                />
              ) : (
                customFieldsRender?.[formField.type]({ form, formField, field, value })
              )}
              {/* <Input id={field.name} type={formField.type} {...field} value={value} /> */}
              {formField.help && <div style={{ color: 'grey' }}>{formField.help}</div>}
              {hasError && <div style={{ color: 'red' }}>{JSON.stringify(form.errors[formField.name])}</div>}
              <Divider dashed style={{ margin: '0.5rem 0' }} />
            </div>
          );
        }}
      </Field>
    ))}
    <Divider />
    <Space>
      <Button type="primary" htmlType="submit" onSubmit={(event) => handleSubmit(event)} disabled={isSubmitting}>
        {isSubmitting ? 'Submitting' : 'Submit'}
      </Button>
      {onReset && (
        <Button onClick={handleReset} disabled={isSubmitting}>
          {isSubmitting ? 'Resetting' : 'Reset'}
        </Button>
      )}
      {onCancel && <Button onClick={onCancel}>Cancel</Button>}
      {onClear && <Button onClick={() => setValues({ fields })}>Clear</Button>}
    </Space>
  </Form>
);

const EasyFormProps: WithFormikConfig<EasyFormProps, FormikValues, FormikValues> = {
  // Transform outer props into form values
  mapPropsToValues: ({ fields, initialValues }) =>
    Object.assign(
      {},
      ..._.map(fields, (field: FormField, name: string) => ({
        [name]: _.get(initialValues, name) ?? field.defaultValue,
      })),
    ),

  validate: (values: FormikValues, props) => {
    const errors: FormikErrors<FormikValues> = {};
    _.forEach(props.fields, (field: FormField, name: string) => {
      if (field.required && !values[name]) {
        errors[name] = 'Required';
      } else if (field.validate) {
        const error = field.validate(values[name]);
        if (error) errors[name] = error;
      }
    });

    if (!_.isEmpty(errors)) console.warn(errors);

    return errors;
  },

  handleSubmit: (values, { props, setSubmitting }) => {
    const submitted = props.onSubmit(values);
    if (isPromiseAlike(submitted)) {
      submitted.finally(() => setSubmitting(false));
    } else {
      Promise.delay(200).then(() => setSubmitting(false));
    }
  },
};
export const useEasyForm = (validationSchema?: any | ((props: EasyFormProps) => any)) =>
  withFormik<EasyFormProps, FormikValues>({ validationSchema, ...EasyFormProps })(InnerForm);
export const EasyForm = withFormik<EasyFormProps, FormikValues>(EasyFormProps)(InnerForm);
