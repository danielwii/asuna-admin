import { EasyForm, FormFields } from '@asuna-admin/components';
import { AppContext } from '@asuna-admin/core';
import { ComponentsHelper } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';
import { Col, Divider, Icon, Row, Typography } from 'antd';

import 'highlight.js/styles/default.css';

import * as _ from 'lodash';
import React, { useEffect, useState } from 'react';
import Highlight from 'react-highlight';
import { FoldingCube } from 'styled-spinkit';
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
  const [body, setBody] = useState({});
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

  const fieldValues = fields(body);
  logger.log('render', props, body, { data, fields, /*initialState, */ fieldValues });

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
  );
}
