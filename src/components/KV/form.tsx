import { InfoCircleOutlined } from '@ant-design/icons';
import { gql, useQuery } from '@apollo/client';

import { Button, Col, Divider, Row, Typography } from 'antd';
import * as _ from 'lodash';
import React from 'react';
import Highlight from 'react-highlight';
import useLogger from '@asuna-stack/asuna-sdk/dist/next/hooks/logger';
import * as util from 'util';

import { isDebugMode } from '../../core/env';
import { KVHelper } from '../../helpers/components';
import { createLogger } from '../../logger';
import { EasyForm } from '../base/easy-form/form';
import { WithLoading } from '../base/helper/helper';

import type { FormFields } from '../base/easy-form/interfaces';

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
  logger.log('get props', props);
  const { kvCollection: collection, kvKey: key, info, /*initialState, */ fields, ...rest } = props;
  logger.log('useQuery', useQuery);
  // const { loading, error, data, refetch } = KVHelper.loadByKey(key, collection);
  const { loading, error, data, refetch } = useQuery(
    gql`
      {
        kv(collection: "${collection}", key: "${key}") {
          collection
          key
          updatedAt
          name
          value
        }
      }
    `,
    { fetchPolicy: 'network-only' },
  );
  const body = _.get(data, 'kv.value', {}) as { type: string; fields: FormFields; values: Record<string, unknown> };

  const initialValues = body.values;
  const fieldValues = fields ? fields(body) : body.fields;

  useLogger('<[FormKVComponent]>', props, body, { loading, error, data }, { initialValues, fieldValues });

  return (
    <WithLoading loading={loading} error={error} retry={refetch}>
      {
        (() => (
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
              <>
                <Divider />
                <Highlight className="json">{util.inspect(data, false, 10)}</Highlight>
              </>
            )}
          </>
        )) as any
      }
    </WithLoading>
  );
}
