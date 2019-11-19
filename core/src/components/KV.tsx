import { EasyForm, EasyGroupForm, FormFields, GroupFormFields } from '@asuna-admin/components';
import { ComponentsHelper } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';
import { Col, Divider, Icon, Row, Typography } from 'antd';
import * as _ from 'lodash';
import React, { useEffect, useState } from 'react';
import Highlight from 'react-highlight';
import * as util from 'util';

import 'highlight.js/styles/default.css';

const logger = createLogger('components:kv-form');

type GroupFormBody = { form: GroupFormFields; values: object };

export function GroupFormKVComponent(props: {
  kvCollection?: string;
  kvKey: string;
  initialState?: { body: GroupFormBody };
  enableClear?: boolean;
  info: React.ReactChild;
});

export function GroupFormKVComponent(props: {
  kvCollection?: string;
  kvKey: string;
  initialState: { body: any };
  enableClear?: boolean;
  info: React.ReactChild;
  fields: (state) => GroupFormFields;
});

export function GroupFormKVComponent(props: {
  kvCollection?: string;
  kvKey: string;
  initialState: { body: GroupFormBody | any };
  enableClear?: boolean;
  info: React.ReactChild;
  fields: (state) => GroupFormFields;
}) {
  const { kvCollection: collection, kvKey: key, info, initialState: preInitialState, fields } = props;
  const initialState = !preInitialState && !fields ? { body: { form: {}, values: {} } } : preInitialState;

  const [state, setState] = useState(initialState);
  const { loading, error, data, refetch } = ComponentsHelper.loadByKey(key, collection);
  useEffect(() => setState({ body: _.get(data, 'kv.value', {}) }), [JSON.stringify(data)]);

  if (loading) return <p>Loading...</p>;
  if (error)
    return (
      <>
        <p>Error :(</p>
        <p>{JSON.stringify(error)}</p>
      </>
    );

  logger.log('render', { state, data });

  return (
    <>
      <Typography>
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
        onClear={() => ComponentsHelper.clear({ key, collection }, refetch)}
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
