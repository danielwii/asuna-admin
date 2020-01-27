import { EasyGroupForm, ErrorInfo, GroupFormFields } from '@asuna-admin/components';
import { AppContext } from '@asuna-admin/core';
import { ComponentsHelper } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';
import { Button, Divider, Icon, Typography } from 'antd';

import 'highlight.js/styles/default.css';

import * as _ from 'lodash';
import React, { useEffect, useState } from 'react';
import Highlight from 'react-highlight';
import { FoldingCube } from 'styled-spinkit';
import * as util from 'util';

const logger = createLogger('components:kv-form:group');

type GroupFormBody = { form: GroupFormFields; values: object };

export function GroupFormKVComponent(props: {
  kvCollection?: string;
  kvKey: string;
  initialState?: { body: GroupFormBody };
  enableClear?: boolean;
  enableDestroy?: boolean;
  info?: React.ReactChild;
});

export function GroupFormKVComponent(props: {
  kvCollection?: string;
  kvKey: string;
  initialState: { body: any };
  enableClear?: boolean;
  enableDestroy?: boolean;
  info?: React.ReactChild;
  fields: (state) => GroupFormFields;
});

export function GroupFormKVComponent(props: {
  kvCollection?: string;
  kvKey: string;
  initialState: { body: GroupFormBody | any };
  enableClear?: boolean;
  enableDestroy?: boolean;
  info?: React.ReactChild;
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

  if (loading) return <FoldingCube />;

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
      {AppContext.isDebugMode && (
        <>
          <Divider />
          <Highlight className="json">{util.inspect(data, false, 10)}</Highlight>
        </>
      )}
    </>
  );
}
