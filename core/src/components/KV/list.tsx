/** @jsx jsx */
import { FormFieldDef, FormFields } from '@asuna-admin/components';
import { AppContext } from '@asuna-admin/core';
import { ComponentsHelper, WithDebugInfo } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';
import { jsx } from '@emotion/core';
import { TextField } from '@material-ui/core';
import { Button, Col, Divider, Icon, Row, Typography } from 'antd';
import { Field, FieldProps, Form, Formik, FormikValues } from 'formik';

import 'highlight.js/styles/default.css';

import * as _ from 'lodash';
import React, { useEffect, useState } from 'react';
import Highlight from 'react-highlight';
import { FoldingCube } from 'styled-spinkit';
import * as util from 'util';
import { DynamicJsonArrayTable } from '../EasyForm/table';

const logger = createLogger('components:kv-form:form');

export function ListKVComponent(props: {
  kvCollection?: string;
  kvKey: string;
  // initialState: { body: FormBody };
  enableClear?: boolean;
  info?: React.ReactChild;
});

export function ListKVComponent(props: {
  kvCollection?: string;
  kvKey: string;
  // initialState: { body: any };
  enableClear?: boolean;
  info?: React.ReactChild;
  fields: (state) => FormFields;
});

export function ListKVComponent(props: {
  kvCollection?: string;
  kvKey: string;
  // initialState: { body: FormBody | any };
  enableClear?: boolean;
  info?: React.ReactChild;
  fields?: (state) => FormFields;
}) {
  const { kvCollection: collection, kvKey: key, info, /*initialState, */ fields } = props;
  const [body, setBody] = useState<Partial<{ type: string; fields: FormFieldDef[]; values: [] }>>({});
  const { loading, error, data, refetch } = ComponentsHelper.loadByKey(key, collection);
  useEffect(() => setBody(_.get(data, 'kv.value', {})), [JSON.stringify(data)]);

  if (loading) return <FoldingCube />;

  if (error)
    return (
      <>
        <p>Error :(</p>
        <p>{JSON.stringify(error)}</p>
      </>
    );

  // return <pre>{JSON.stringify({ fields, body }, null, 2)}</pre>;

  // const fieldValues = fields(body);
  // logger.log('render', props, body, { data, fields, /*initialState, */ fieldValues });

  return (
    <>
      <Typography>
        <Typography.Paragraph>
          <Icon type="info-circle" style={{ margin: '0 0.2rem' }} />
          {info}
        </Typography.Paragraph>
      </Typography>
      <Divider />
      <Row gutter={16}>
        <Col span={18}>
          <Formik
            initialValues={{ values: body.values, firstName: 'hi' }}
            onSubmit={(values, formikHelpers) =>
              ComponentsHelper.save({ key, collection }, { ...body, ...values }, refetch)
            }
          >
            {formikBag => (
              <Form>
                <Field name="values">
                  {({ field, meta, form }: FieldProps<FormikValues>) => (
                    <WithDebugInfo info={{ field, meta }}>
                      <DynamicJsonArrayTable<[]>
                        mode="array"
                        value={body.values ?? []}
                        preview={item => <pre>{JSON.stringify(item, null, 2)}</pre>}
                        onChange={values => formikBag.setFieldValue(field.name, values)}
                        render={(innerFormik, item, index) =>
                          _.map(body.fields, (fieldDef: FormFieldDef) => (
                            <TextField
                              key={`${index}-${fieldDef.field.name}`}
                              style={{ marginRight: '.2rem' }}
                              name={`[${index}].${fieldDef.field.name}`}
                              value={item?.[fieldDef.field.name]}
                              onChange={event => innerFormik.handleChange(event)}
                              label={fieldDef.name + `values[${index}].${fieldDef.field.name}`}
                              multiline
                            />
                          ))
                        }
                      />
                    </WithDebugInfo>
                  )}
                </Field>
                <Divider />
                <Button
                  type="primary"
                  htmlType="submit"
                  onSubmit={formikBag.handleSubmit}
                  disabled={formikBag.isSubmitting}
                >
                  {formikBag.isSubmitting ? 'Submitting' : 'Submit'}
                </Button>
              </Form>
            )}
          </Formik>
        </Col>
        {AppContext.isDebugMode && (
          <Col span={6}>
            <div>
              <h3>Preview:</h3>
              <Highlight className="json">{JSON.stringify(body, null, 2)}</Highlight>
            </div>
          </Col>
        )}
      </Row>
      {AppContext.isDebugMode && (
        <>
          <Divider />
          <Highlight className="json">{util.inspect(data, false, 10)}</Highlight>
        </>
      )}
    </>
  );
}
