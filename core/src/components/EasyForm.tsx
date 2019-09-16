import { FormControl, FormHelperText, Input, InputLabel } from '@material-ui/core';
import * as antd from 'antd';
import * as formik from 'formik';
import * as _ from 'lodash';
import * as React from 'react';

type FormField = {
  name: string;
  type: 'number' | 'string';
  validate: (value) => string | null;
  help?: string;
  required?: boolean;
  defaultValue?: boolean | number | string;
};

type FormFields = { [key: string]: FormField };

interface FormProps {
  message?: string | React.ReactChild;
  body?: string | React.ReactChild;
  fields: FormFields;
}

const InnerForm = (props: FormProps & formik.FormikProps<formik.FormikValues>) => {
  const { touched, errors, isSubmitting, message, body, fields, handleSubmit, values } = props;
  return (
    <formik.Form>
      {message && <h1>{message}</h1>}
      {_.map(fields, (formField: FormField, key: string) => (
        <div key={key}>
          <formik.Field
            name={formField.name}
            render={({ field, form }: formik.FieldProps<formik.FormikValues>) => {
              const hasError = !!(form.touched[formField.name] && form.errors[formField.name]);
              return (
                <div>
                  <FormControl error={hasError}>
                    <InputLabel htmlFor={field.name}>{field.name}</InputLabel>
                    <Input id={field.name} type={formField.type} {...field} />
                    {formField.help && <FormHelperText>{formField.help}</FormHelperText>}
                    {hasError && <FormHelperText>{form.errors[formField.name]}</FormHelperText>}
                  </FormControl>
                </div>
              );
            }}
          />
        </div>
      ))}

      <antd.Divider />

      <antd.Button htmlType="submit" onSubmit={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? 'Submitting' : 'Submit'}
      </antd.Button>
    </formik.Form>
  );
};

interface FormRenderProps extends FormProps {
  // initialValues(props): any;
}

/*  creatable: (key, actions, extras) => {
    // Modal.info({ content: JSON.stringify({ key, actions, extras }) });
    Modal.info({
      okText: '取消',
      content: (
        <FormRender
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
const FormRender = formik.withFormik<FormRenderProps, any>({
  // Transform outer props into form values
  mapPropsToValues: props =>
    Object.assign({}, ..._.map(props.fields, field => ({ [field.name]: field.defaultValue }))),

  validate: (values: formik.FormikValues, props) => {
    const errors: formik.FormikErrors<formik.FormikValues> = {};

    _.forEach(props.fields, field => {
      if (field.required && !values[field.name]) {
        errors[field.name] = 'Required';
      } else if (field.validate) {
        const error = field.validate(values[field.name]);
        if (error) errors[field.name] = error;
      }
    });

    return errors;
  },

  handleSubmit: (values, formikBag) => {
    console.log(values, formikBag);
    // Modal.info({ content: JSON.stringify({ values }) });
    // do submitting things
  },
})(InnerForm);
