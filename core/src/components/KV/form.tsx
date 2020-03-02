import { EasyForm, FormFields, WithLoading } from '@asuna-admin/components';
import { AppContext } from '@asuna-admin/core';
import { ComponentsHelper } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';

import { InfoCircleOutlined } from '@ant-design/icons';

import { Button, Col, Divider, Row, Typography } from 'antd';

import 'highlight.js/styles/default.css';
import * as _ from 'lodash';
import React from 'react';
import Highlight from 'react-highlight';
import { useLogger } from 'react-use';
import * as util from 'util';

const logger = createLogger('components:kv-form:form');

type FormBody = { form: FormFields; values: object };

export function FormKVComponent(props: {
  kvCollection?: string;
  kvKey: string;
  // initialState: { body: FormBody };
  enableClear?: boolean;
  info: React.ReactChild;
});

export function FormKVComponent(props: {
  kvCollection?: string;
  kvKey: string;
  // initialState: { body: any };
  enableClear?: boolean;
  info: React.ReactChild;
  fields: (state) => FormFields;
});

export function FormKVComponent(props: {
  kvCollection?: string;
  kvKey: string;
  // initialState: { body: FormBody | any };
  enableClear?: boolean;
  info: React.ReactChild;
  fields: (state) => FormFields;
}) {
  const { kvCollection: collection, kvKey: key, info, /*initialState, */ fields } = props;
  const { loading, error, data, refetch } = ComponentsHelper.loadByKey(key, collection);
  const body = _.get(data, 'kv.value', {});
  useLogger(FormKVComponent.name, props, body, { loading, error, data });

  const fieldValues = fields(body);
  logger.log('render', props, body, { loading, error, data, fields, /*initialState, */ fieldValues });

  return (
    <WithLoading loading={loading} error={error} retry={refetch}>
      {() => (
        <>
          <Typography>
            <Button onClick={() => refetch()}>Reload</Button>
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
              <EasyForm
                fields={fieldValues}
                onSubmit={values => ComponentsHelper.save({ key, collection }, values, refetch)}
                onClear={() => ComponentsHelper.clear({ key, collection }, refetch)}
              />
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
      )}
    </WithLoading>
  );
}
