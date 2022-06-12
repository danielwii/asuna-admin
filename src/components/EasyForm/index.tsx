import { FormControl, FormHelperText } from '@material-ui/core';

import * as antd from 'antd';
import { Divider, Popconfirm } from 'antd';
import * as formik from 'formik';
import _ from 'lodash';
import * as React from 'react';
import Highlight from 'react-highlight';

import { AppContext } from '../../core/context';
import { createLogger } from '../../logger';
import { RenderInputComponent } from '../base/easy-form/form';

import type { FormFieldDef, FormFieldsGroup } from '../base/easy-form/interfaces';

const logger = createLogger('components:easy-form');

interface FormProps<FieldsType> {
  message?: string | React.ReactChild;
  body?: string | React.ReactChild;
  fields: FieldsType;
}

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
                          <RenderInputComponent form={form} fieldDef={fieldDef} field={field as any} value={value} />
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
              <antd.Button type="primary" danger>
                {isSubmitting ? 'Destroying' : 'Destroy'}
              </antd.Button>
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
  mapPropsToValues: (props) =>
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
    const merged = _.mergeWith(props.fieldValues, values, (objValue, srcValue) =>
      _.isObject(srcValue) ? { ...objValue, ...srcValue } : srcValue,
    );
    // logger.log(props.fieldValues, values, merged);
    props.onSubmit(merged).finally(() => setSubmitting(false));
  },
})(GroupInnerForm) as any;
