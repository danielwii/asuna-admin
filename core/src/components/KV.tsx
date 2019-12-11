import { EasyForm, EasyGroupForm, ErrorInfo, FormFields, GroupFormFields } from '@asuna-admin/components';
import { ComponentsHelper } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';
import { Button, Col, Divider, Icon, Row, Typography } from 'antd';

import 'highlight.js/styles/default.css';

import * as _ from 'lodash';
import React, { useEffect, useState } from 'react';
import Highlight from 'react-highlight';
import * as util from 'util';

const logger = createLogger('components:kv-form');

type GroupFormBody = { form: GroupFormFields; values: object };

export function GroupFormKVComponent(props: {
  kvCollection?: string;
  kvKey: string;
  initialState?: { body: GroupFormBody };
  enableClear?: boolean;
  enableDestroy?: boolean;
  info: React.ReactChild;
});

export function GroupFormKVComponent(props: {
  kvCollection?: string;
  kvKey: string;
  initialState: { body: any };
  enableClear?: boolean;
  enableDestroy?: boolean;
  info: React.ReactChild;
  fields: (state) => GroupFormFields;
});

export function GroupFormKVComponent(props: {
  kvCollection?: string;
  kvKey: string;
  initialState: { body: GroupFormBody | any };
  enableClear?: boolean;
  enableDestroy?: boolean;
  info: React.ReactChild;
  fields: (state) => GroupFormFields;
}) {
  const {
    kvCollection: collection,
    kvKey: key,
    info,
    initialState: preInitialState,
    fields,
    enableClear,
    enableDestroy,
  } = props;
  const initialState = !preInitialState && !fields ? { body: { form: {}, values: {} } } : preInitialState;

  const [state, setState] = useState(initialState);
  const { loading, error, data, refetch, networkStatus } = ComponentsHelper.loadByKey(key, collection);
  useEffect(() => setState({ body: _.get(data, 'kv.value', {}) }), [JSON.stringify(data)]);

  if (loading) return <p>Loading...</p>;
  if (error)
    return (
      <>
        <Button onClick={() => refetch()}>Reload</Button>
        <ErrorInfo>
          <pre>{util.inspect(error)}</pre>
        </ErrorInfo>
      </>
    );

  logger.log('render', { state, data });

  return (
    <>
      <Typography>
        <Button onClick={() => refetch()}>Reload</Button>
        <Typography.Paragraph>
          <Icon type="info-circle" style={{ margin: '0 0.2rem' }} />
          {info}
        </Typography.Paragraph>
      </Typography>
      <Divider />
      <EasyGroupForm
        fields={state.body.form}
        fieldValues={state.body.values}
        onSubmit={values => ComponentsHelper.save({ key, collection }, { form: state.body.form, values }, refetch)}
        onClear={enableClear ? () => ComponentsHelper.clear({ key, collection }, refetch) : undefined}
        onDestroy={enableDestroy ? () => ComponentsHelper.destroy({ key, collection }, refetch) : undefined}
      />
      <Divider />
      <Highlight language="json">{util.inspect(data, false, 10)}</Highlight>
    </>
  );
}

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

  if (loading) return <p>Loading...</p>;
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
        <Col span={6}>
          <div>
            <h3>Preview:</h3>
            <Highlight language="json">{JSON.stringify(body, null, 2)}</Highlight>
          </div>
        </Col>
      </Row>
      <Divider />
      <Highlight language="json">{util.inspect(data, false, 10)}</Highlight>
    </>
  );
}
