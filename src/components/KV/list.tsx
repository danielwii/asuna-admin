import { InfoCircleOutlined } from '@ant-design/icons';
import { TextField } from '@material-ui/core';

import { Button, Col, Divider, Row, Typography } from 'antd';
import { Field, FieldProps, Form, Formik, FormikValues } from 'formik';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import Highlight from 'react-highlight';
import { FoldingCube } from 'styled-spinkit';
import * as util from 'util';

import { isDebugMode } from '../../core/env';
import { KVHelper } from '../../helpers/components';
import { WithDebugInfo } from '../../helpers/debug';
import { createLogger } from '../../logger';
import { DynamicJsonArrayTable, ObjectArrayJsonTableHelper } from '../base/table-helper/dynamic-json-array-table';

import type { FormFieldDef, FormFields } from '../base/easy-form/interfaces';

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
  const { loading, error, data, refetch } = KVHelper.loadByKey(key, collection);
  useEffect(() => setBody(_.get(data, 'kv.value', {})), [JSON.stringify(data)]);

  if (loading) return <FoldingCube />;

  if (error)
    return (
      <React.Fragment>
        <p>Error :(</p>
        <p>{JSON.stringify(error)}</p>
      </React.Fragment>
    );

  // return <pre>{JSON.stringify({ fields, body }, null, 2)}</pre>;

  // const fieldValues = fields(body);
  // logger.log('render', props, body, { data, fields, /*initialState, */ fieldValues });

  return (
    <React.Fragment>
      <Typography>
        <Button onClick={() => refetch()} loading={loading}>
          Reload
        </Button>
        {info && (
          <Typography.Paragraph>
            <InfoCircleOutlined style={{ margin: '0 0.2rem' }} />
            {info}
          </Typography.Paragraph>
        )}
      </Typography>
      <Divider />
      <Row gutter={16}>
        <Col span={18}>
          {body.values && (
            <Formik
              initialValues={{ values: body.values }}
              onSubmit={(values, formikHelpers) => KVHelper.save({ key, collection }, { ...body, ...values }, refetch)}
            >
              {(formikBag) => (
                <Form>
                  <Field name="values">
                    {({ field, form, meta }: FieldProps<FormikValues>) => (
                      <WithDebugInfo
                        info={{
                          body,
                          formikBag: _.pick(formikBag, 'initialValues', 'values'),
                          field,
                          form,
                          value: formikBag.values.values ?? body.values ?? [],
                        }}
                      >
                        <DynamicJsonArrayTable
                          adapter={ObjectArrayJsonTableHelper}
                          value={(formikBag.values.values ?? formikBag.initialValues.values ?? body.values) as any}
                          preview={(item) => <div>{util.inspect(ObjectArrayJsonTableHelper.keyParser(item))}</div>}
                          onChange={(values) => form.setFieldValue(field.name, values)}
                          render={({ fieldOpts, index }) =>
                            _.map(body.fields, (fieldDef: FormFieldDef) => (
                              <WithDebugInfo
                                info={{ field, fieldDef, opts: fieldOpts(fieldDef.field.name, index) }}
                                key={fieldDef.name}
                              >
                                <TextField
                                  label={fieldDef.name}
                                  style={{ marginRight: '.2rem' }}
                                  {...fieldOpts(fieldDef.field.name, index)}
                                  multiline
                                />
                              </WithDebugInfo>
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
          )}
        </Col>
        {isDebugMode && (
          <Col span={6}>
            <div>
              <h3>Preview:</h3>
              <Highlight className="json">{JSON.stringify(body, null, 2)}</Highlight>
            </div>
          </Col>
        )}
      </Row>
      {isDebugMode && (
        <React.Fragment>
          <Divider />
          <Highlight className="json">{util.inspect(data, false, 10)}</Highlight>
        </React.Fragment>
      )}
    </React.Fragment>
  );
}
