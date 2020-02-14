import { Config } from '@asuna-admin/config';
import { AppContext } from '@asuna-admin/core';
import { DebugInfo, WithDebugInfo } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';
import { FormControl, FormControlLabel, FormHelperText, Switch, TextField } from '@material-ui/core';
import * as antd from 'antd';
import { Divider, Popconfirm } from 'antd';
import { DynamicJsonArrayTable, ObjectArrayHelper } from 'asuna-components';
import { changeAntdTheme, getThemeColor } from 'dynamic-antd-theme';
import * as formik from 'formik';
import { FieldInputProps, FormikProps } from 'formik';
import * as _ from 'lodash';
import * as React from 'react';
import { SketchPicker } from 'react-color';
import Highlight from 'react-highlight';
import * as util from 'util';

import { ImageUploader } from '../DynamicForm/ImageUploader';
import { FormField, FormFieldDef, FormFields, FormFieldsGroup, FormFieldType } from './interfaces';

export * from './interfaces';

const logger = createLogger('components:easy-form');

interface FormProps<FieldsType> {
  message?: string | React.ReactChild;
  body?: string | React.ReactChild;
  fields: FieldsType;
}

interface EasyFormProps extends FormProps<FormFields> {
  // initialValues(props): any;
  onSubmit: (values: any) => Promise<any> | void;
  onClear?: () => Promise<any>;
}

export function RenderInputComponent({
  form,
  fieldDef,
  field,
  value,
}: {
  form: FormikProps<any>;
  fieldDef: FormFieldDef;
  field: FieldInputProps<any>;
  value: any;
}) {
  logger.log('[RenderInputComponent]', field, { fieldDef, value });
  switch (fieldDef.field.type) {
    case FormFieldType.boolean: {
      return (
        <FormControlLabel
          control={
            <Switch
              onChange={(event, checked) =>
                field.onChange({ target: { id: field.name, name: field.name, value: checked } })
              }
              defaultChecked={value}
              // value={value}
              color="primary"
            />
          }
          label={fieldDef.name}
        />
      );
    }
    case FormFieldType.color: {
      return (
        <SketchPicker
          color={value}
          onChange={color => {
            changeAntdTheme(getThemeColor(color.hex));
            field.onChange({ target: { id: field.name, name: field.name, value: color } });
          }}
        />
      );
    }
    case FormFieldType.image: {
      return (
        <>
          <br />
          <ImageUploader
            many={false}
            urlHandler={Config.get('IMAGE_RES_HANDLER')}
            value={value}
            onChange={newValue => {
              logger.log('[RenderInputComponent]', { fieldDef, value, newValue });
              field.onChange({ target: { id: field.name, name: field.name, value: newValue } });
            }}
          />
        </>
      );
    }
    case FormFieldType.string:
    case FormFieldType.text: {
      const label = field.name === fieldDef.name ? field.name : `${field.name} / ${fieldDef.name}`;
      return (
        <>
          {/*<antd.Input.TextArea id={field.name} {...field} autoSize rows={4} value={value} />*/}
          <TextField id={field.name} multiline {...field} value={value} label={label} />
          {/*<DebugInfo data={{ field, fieldDef, value }} />*/}
        </>
      );
    }
    case FormFieldType.wxTmplData: {
      const label = field.name === fieldDef.name ? field.name : `${field.name} / ${fieldDef.name}`;
      return (
        <>
          <label>{label}</label>
          <DynamicJsonArrayTable
            adapter={ObjectArrayHelper}
            value={value}
            preview={item => <pre>{util.inspect(ObjectArrayHelper.keyParser(item))}</pre>}
            render={({ fieldOpts, index }) => (
              <antd.Card>
                <TextField {...fieldOpts('key', index)} label="key" />{' '}
                <TextField {...fieldOpts('color', index)} label="color" />
                <TextField {...fieldOpts('value', index)} label="value" fullWidth multiline />
              </antd.Card>
            )}
            onChange={values => form.setFieldValue(field.name, values)}
          />
          {/*<DebugInfo data={value} type="util" />*/}
        </>
      );
    }
    case FormFieldType.wxSubscribeData: {
      const label = field.name === fieldDef.name ? field.name : `${field.name} / ${fieldDef.name}`;
      return (
        <>
          <label>{label}</label>
          <DynamicJsonArrayTable
            adapter={ObjectArrayHelper}
            value={value}
            preview={item => <pre>{util.inspect(ObjectArrayHelper.keyParser(item))}</pre>}
            render={({ fieldOpts, index }) => (
              <antd.Card>
                <TextField {...fieldOpts('key', index)} label="key" />
                <TextField {...fieldOpts('value', index)} label="value" fullWidth multiline />
              </antd.Card>
            )}
            onChange={values => {
              console.log('onChange', field.name, values);
              form.setFieldValue(field.name, values);
            }}
          />
          <DebugInfo data={value} type="util" />
        </>
      );
    }
    default: {
      const label = field.name === fieldDef.name ? field.name : `${field.name} / ${fieldDef.name}`;
      return (
        <WithDebugInfo info={{ field, fieldDef, value, label }}>
          <TextField id={field.name} type={fieldDef.field.type} {...field} value={value} label={label} />
          {/*<DebugInfo data={{ field, fieldDef, value }} />*/}
        </WithDebugInfo>
      );
    }
  }
}

const InnerForm = (props: EasyFormProps & formik.FormikProps<formik.FormikValues>) => {
  const { touched, errors, isSubmitting, message, body, fields, handleSubmit, handleReset, values, onClear } = props;
  logger.log('[InnerForm]', props.values);
  return (
    <formik.Form>
      {message && <h1>{message}</h1>}
      {_.map(fields, (formField: FormField, key: string) => (
        <formik.Field key={key} name={key}>
          {({ field, form }: formik.FieldProps<formik.FormikValues>) => {
            const hasError = !!(form.touched[formField.name] && form.errors[formField.name]);
            const value = field.value ?? formField.defaultValue;
            logger.log('render field', field, { hasError, value }, formField);
            return (
              <FormControl key={field.name} error={hasError} fullWidth={true}>
                <RenderInputComponent
                  form={form}
                  fieldDef={{ field: formField, name: formField.name }}
                  field={field}
                  value={value}
                />
                {/*<Input id={field.name} type={formField.type} {...field} value={value} />*/}
                {formField.help && <FormHelperText>{formField.help}</FormHelperText>}
                {hasError && <FormHelperText>{form.errors[formField.name]}</FormHelperText>}
                <Divider dashed={true} style={{ margin: '0.5rem 0' }} />
              </FormControl>
            );
          }}
        </formik.Field>
      ))}
      <antd.Divider />
      <antd.Button type="primary" htmlType="submit" onSubmit={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? 'Submitting' : 'Submit'}
      </antd.Button>{' '}
      {onClear && (
        <antd.Button onClick={handleReset} disabled={isSubmitting}>
          {isSubmitting ? 'Resetting' : 'Reset'}
        </antd.Button>
      )}
    </formik.Form>
  );
};

/*  creatable: (key, actions, extras) => {
    // Modal.info({ content: JSON.stringify({ key, actions, extras }) });
    Modal.info({
      okText: '取消',
      content: (
        <EasyForm
          fields={{
            change: {
              name: 'change',
              defaultValue: 0,
              type: 'number',
              validate: value => (_.isNumber(value) && value === 0 ? '不为 0 的数字' : null),
            } as FormField,
            reason: { name: 'reason', defaultValue: '', type: 'string' } as FormField,
          }}
        />
      ),
    });
  },*/
export const EasyForm = formik.withFormik<EasyFormProps, any>({
  // Transform outer props into form values
  mapPropsToValues: props =>
    Object.assign({}, ..._.map(props.fields, (field: FormField, name: string) => ({ [name]: field.defaultValue }))),

  validate: (values: formik.FormikValues, props) => {
    const errors: formik.FormikErrors<formik.FormikValues> = {};

    _.forEach(props.fields, (field: FormField, name: string) => {
      if (field.required && !values[name]) {
        errors[name] = 'Required';
      } else if (field.validate) {
        const error = field.validate(values[name]);
        if (error) errors[name] = error;
      }
    });

    return errors;
  },

  handleSubmit: (values, { props, setSubmitting }) => {
    const submitted = props.onSubmit(values);
    if (submitted && submitted.then) submitted.finally(() => setSubmitting(false));
  },
})(InnerForm);

// --------------------------------------------------------------
// GroupForm
// --------------------------------------------------------------

interface ValuesFormProps extends FormProps<GroupFormFields> {
  fieldValues: { [key: string]: any };
}

export type GroupFormFields = { [groupKey: string]: FormFieldsGroup };

interface GroupEasyFormProps extends ValuesFormProps {
  // initialValues(props): any;
  onSubmit: (values: any) => Promise<any>;
  onClear?: () => Promise<any>;
  onDestroy?: () => Promise<any>;
}

const GroupInnerForm = (props: GroupEasyFormProps & formik.FormikProps<formik.FormikValues>) => {
  const {
    touched,
    errors,
    isSubmitting,
    message,
    body,
    fields,
    handleSubmit,
    handleReset,
    values,
    fieldValues,
    onClear,
    onDestroy,
  } = props;
  return (
    <antd.Row gutter={16}>
      <antd.Col span={18}>
        <formik.Form>
          {message && <h1>{message}</h1>}
          {_.map(fields, (fieldsGroup: FormFieldsGroup, key: string) => (
            <div key={key}>
              {fieldsGroup.name && <h2>{fieldsGroup.name}</h2>}
              {_.map(fieldsGroup.fields, (fieldDef: FormFieldDef) => {
                const formField = fieldDef.field;
                return (
                  <formik.Field key={fieldDef.name} name={formField.name}>
                    {({ field, form }: formik.FieldProps<formik.FormikValues>) => {
                      const hasError = !!(form.touched[formField.name] && form.errors[formField.name]);
                      const value = field.value ?? _.get(fieldValues, formField.name) ?? formField.defaultValue;
                      return (
                        <FormControl error={hasError} fullWidth={true}>
                          {/*<InputLabel htmlFor={field.name}>{field.name} / {fieldDef.name}</InputLabel>*/}
                          {/*<Input id={field.name} type={formField.type} {...field} value={value} />*/}
                          <RenderInputComponent form={form} fieldDef={fieldDef} field={field} value={value} />
                          {formField.help && <FormHelperText>{formField.help}</FormHelperText>}
                          {hasError && <FormHelperText>{form.errors[formField.name]}</FormHelperText>}
                          <Divider type="horizontal" style={{ margin: '0.5rem 0' }} />
                        </FormControl>
                      );
                    }}
                  </formik.Field>
                );
              })}
              <Divider type="horizontal" dashed />
            </div>
          ))}
          <antd.Divider />
          <antd.Button type="primary" htmlType="submit" onSubmit={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting' : 'Submit'}
          </antd.Button>{' '}
          {/*<antd.Button onClick={handleReset} disabled={isSubmitting}>
            {isSubmitting ? 'Resetting' : 'Reset'}
          </antd.Button>{' '}*/}
          {/*<antd.Button type="danger" onClick={onClear} disabled={isSubmitting}>*/}
          {/*  {isSubmitting ? 'Clearing' : 'Clear'}*/}
          {/*</antd.Button>*/}
          {onDestroy && (
            <Popconfirm
              title="Are you sure?"
              onConfirm={onDestroy}
              // onCancel={cancel}
              okText="Yes"
              cancelText="No"
              disabled={isSubmitting}
            >
              <antd.Button type="danger">{isSubmitting ? 'Destroying' : 'Destroy'}</antd.Button>
            </Popconfirm>
          )}
        </formik.Form>
      </antd.Col>
      {AppContext.isDebugMode && (
        <antd.Col span={6}>
          <div>
            <h3>Preview:</h3>
            <Highlight className="json">
              {JSON.stringify({ touched, errors, isSubmitting, message, body, values, fieldValues }, null, 2)}
            </Highlight>
          </div>
        </antd.Col>
      )}
    </antd.Row>
  );
};

export const EasyGroupForm = formik.withFormik<GroupEasyFormProps, any>({
  // Transform outer props into form values
  mapPropsToValues: props =>
    Object.assign(
      {},
      ..._.flattenDeep(
        _.map(props.fields, (fieldsGroup: FormFieldsGroup) =>
          _.map(fieldsGroup.fields, (fieldDef: FormFieldDef) => ({
            [fieldDef.field.name]: fieldDef.field.defaultValue,
          })),
        ),
      ),
    ),

  validate: (values: formik.FormikValues, props) => {
    const errors: formik.FormikErrors<formik.FormikValues> = {};

    _.forEach(props.fields, (fieldsGroup: FormFieldsGroup) => {
      _.forEach(fieldsGroup.fields, (fieldDef: FormFieldDef) => {
        const field = fieldDef.field;
        if (field.required && !values[field.name]) {
          errors[field.name] = 'Required';
        } else if (field.validate) {
          const error = field.validate(values[field.name]);
          if (error) errors[field.name] = error;
        }
      });
    });

    return errors;
  },

  handleSubmit: (values, { props, setSubmitting }) => {
    props
      .onSubmit(_.mergeWith(props.fieldValues, values, (objValue, srcValue) => srcValue))
      .finally(() => setSubmitting(false));
  },
})(GroupInnerForm);
