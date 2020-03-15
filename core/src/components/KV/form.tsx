import { EasyForm, FormFields, WithLoading } from '@asuna-admin/components';
import { AppContext } from '@asuna-admin/core';
import { KVHelper } from '@asuna-admin/helpers';
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

type FormBody<ExtraProps> = { form: FormFields<ExtraProps>; values: object };

export function FormKVComponent(props: {
  kvCollection?: string;
  kvKey: string;
  // initialState: { body: FormBody };
  enableClear?: boolean;
  info: React.ReactChild;
});

export function FormKVComponent<ExtraProps = any>(props: {
  kvCollection?: string;
  kvKey: string;
  // initialState: { body: any };
  enableClear?: boolean;
  info: React.ReactChild;
  fields: (state) => FormFields<ExtraProps>;
});

export function FormKVComponent<ExtraProps = any>(props: {
  kvCollection?: string;
  kvKey: string;
  // initialState: { body: FormBody | any };
  enableClear?: boolean;
  info: React.ReactChild;
  fields: (state) => FormFields<ExtraProps>;
}) {
  const { kvCollection: collection, kvKey: key, info, /*initialState, */ fields } = props;
  const { loading, error, data, refetch } = KVHelper.loadByKey(key, collection);
  const body = _.get(data, 'kv.value', {});
  useLogger('FormKVComponent', props, body, { loading, error, data });

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
                onSubmit={values => KVHelper.save({ key, collection }, values, refetch)}
                onClear={() => KVHelper.clear({ key, collection }, refetch)}
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
