import { InfoCircleOutlined } from '@ant-design/icons';

import { Button, Divider, Typography } from 'antd';
import * as _ from 'lodash';
import React, { useEffect, useState } from 'react';
import Highlight, { HighlightProps } from 'react-highlight';
import { FoldingCube } from 'styled-spinkit';
import * as util from 'util';

import { isDebugMode } from '../../core/env';
import { KVHelper } from '../../helpers/components';
import { createLogger } from '../../logger';
import { ErrorInfo } from '../base/error';
import { EasyGroupForm, GroupFormFields } from '../EasyForm';

const logger = createLogger('components:kv-form:group');
const HighlightComponent: React.FC<React.PropsWithChildren<HighlightProps>> = Highlight as any;

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
  const { loading, error, data, refetch } = KVHelper.loadByKey(key, collection);
  const value = _.get(data, 'kv.value', {});
  useEffect(
    () =>
      setState({
        body: { form: { ...initialState.body.form, ...value.form }, values: value.values },
      }),
    [JSON.stringify(data)],
  );

  if (loading) return <FoldingCube />;

  if (error)
    return (
      <>
        <Button onClick={() => refetch()} loading={loading}>
          Reload
        </Button>
        <ErrorInfo>
          <pre>{util.inspect(error)}</pre>
        </ErrorInfo>
      </>
    );

  logger.log('render', { state, data });

  return (
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
      <EasyGroupForm
        fields={state.body.form}
        fieldValues={state.body.values}
        onSubmit={(values) => KVHelper.save({ key, collection }, { form: state.body.form, values }, refetch)}
        onClear={enableClear ? () => KVHelper.clear({ key, collection }, refetch) : undefined}
        onDestroy={enableDestroy ? () => KVHelper.destroy({ key, collection }, refetch) : undefined}
      />
      {isDebugMode && (
        <>
          <Divider />
          <HighlightComponent className="json">{util.inspect(data, false, 10)}</HighlightComponent>
        </>
      )}
    </>
  );
}
