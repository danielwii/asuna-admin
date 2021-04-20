import { InfoCircleOutlined } from '@ant-design/icons';

import { Button, Col, Divider, Row, Typography } from 'antd';
import { EasyForm, FormFields, WithLoading } from '@danielwii/asuna-components';
import 'highlight.js/styles/default.css';
import * as _ from 'lodash';
import React from 'react';
import Highlight from 'react-highlight';
import { useLogger } from 'react-use';
import * as util from 'util';

import { AppContext } from '../../core';
import { KVHelper } from '../../helpers';
import { createLogger } from '../../logger';

const logger = createLogger('components:kv-form:form');

export function FormKVComponent(props: {
  kvCollection?: string;
  kvKey: string;
  // initialState: { body: FormBody };
  enableClear?: boolean;
  info?: React.ReactChild;
});

export function FormKVComponent(props: {
  kvCollection?: string;
  kvKey: string;
  // initialState: { body: any };
  enableClear?: boolean;
  info?: React.ReactChild;
  fields: (state) => FormFields;
});

export function FormKVComponent(props: {
  kvCollection?: string;
  kvKey: string;
  // initialState: { body: FormBody | any };
  enableClear?: boolean;
  info?: React.ReactChild;
  fields?: (state) => FormFields;
}) {
  const { kvCollection: collection, kvKey: key, info, /*initialState, */ fields } = props;
  const { loading, error, data, refetch } = KVHelper.loadByKey(key, collection);
  const body = _.get(data, 'kv.value', {}) as { type: string; fields: FormFields; values: Record<string, unknown> };

  const initialValues = body.values;
  const fieldValues = fields ? fields(body) : body.fields;

  useLogger('FormKVComponent', props, body, { loading, error, data }, { initialValues, fieldValues });
  logger.log('render', props, body, { loading, error, data, fields, /*initialState, */ fieldValues });

  return (
    <WithLoading loading={loading} error={error} retry={refetch}>
      {() => (
        <>
          <Typography>
            <Button onClick={() => refetch()} loading={loading}>
              Reload
            </Button>
            {info && (
              <>
                <Divider />
                <Typography.Paragraph>
                  <InfoCircleOutlined style={{ margin: '0 0.2rem' }} />
                  {info}
                </Typography.Paragraph>
              </>
            )}
          </Typography>
          <Divider />
          <Row gutter={16}>
            <Col span={18}>
              <EasyForm
                initialValues={initialValues}
                fields={fieldValues}
                onSubmit={(values) => KVHelper.save({ key, collection }, { ...body, values }, refetch)}
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
