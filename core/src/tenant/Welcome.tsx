import { adminProxyCaller, TenantInfo } from '@asuna-admin/adapters';
import { DynamicFormTypes, ErrorInfo, FormModalButton } from '@asuna-admin/components';
import { StoreContext } from '@asuna-admin/context/store';
import { AppContext } from '@asuna-admin/core';
import { ModelsHelper, parseResponseError, TenantHelper, toErrorMessage } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';
import { Asuna } from '@asuna-admin/types';
import { Button, Descriptions, Divider, Popconfirm } from 'antd';
import { Promise } from 'bluebird';
import * as _ from 'lodash';
import React, { useContext, useState } from 'react';
import { useAsync, useLogger } from 'react-use';
import { FoldingCube } from 'styled-spinkit';
import * as util from 'util';

const logger = createLogger('tenant:welcome');

async function createFirstModel(tenantInfo?: TenantInfo): Promise<void> {
  // TODO add validation info to error or console box (not implemented yet).
  if (tenantInfo?.config?.firstModelName) {
    ModelsHelper.openCreatePane(tenantInfo?.config.firstModelName);
  }
}

export const TenantWelcome: React.FC = props => {
  const [count, reload] = useState(0);
  const { store } = useContext(StoreContext);
  const { value, error, loading } = useAsync(async () => {
    return Promise.props({
      // tenantInfo: adminProxyCaller().tenantInfo(),
      schemas: Promise.props<{ [name: string]: Asuna.Schema.OriginSchema }>(
        _.mapValues(store.tenantInfo?.recordCounts, (count, name) => AppContext.adapters.models.loadOriginSchema(name)),
      ),
    });
  });
  // const securityState = useSelector<RootState, SecurityState>(state => state.security);

  if (AppContext.isDebugMode) useLogger('TenantWelcome', props, { count, store, value });

  const authorized = TenantHelper.authorized(store.tenantInfo);

  const contactInfo = (
    <>
      {!authorized && (
        <>
          <b>账户未激活</b>，
        </>
      )}
      如需帮助，请联系
      <Button type="link" size="small">
        管理员
      </Button>
      。
    </>
  );

  if (loading) return <FoldingCube />;
  if (error) {
    return (
      <>
        {contactInfo}
        <ErrorInfo>
          <pre>{util.inspect(parseResponseError(error))}</pre>
          <Divider />
          <pre>{util.inspect({ store }, { depth: 10 })}</pre>
        </ErrorInfo>
      </>
    );
  }

  const info = store.tenantInfo?.config?.enabled ? (
    <>
      绑定{' '}
      <FormModalButton
        title="绑定账户"
        onRefresh={() => reload(count + 1)}
        openButton={open => (
          <Button size="small" type="dashed" onClick={open}>
            账户
          </Button>
        )}
        onSubmit={({ name, description }) => adminProxyCaller().registerTenant({ name, description })}
        fields={{
          name: {
            name: 'name',
            type: DynamicFormTypes.Input,
            options: { required: true, name: '账户名称' },
          },
          description: { name: 'description', type: DynamicFormTypes.TextArea, options: { name: '描述' } },
        }}
      />
    </>
  ) : (
    'Welcome'
  );

  const recordsInfo = store.tenantInfo?.config?.enabled ? (
    <Descriptions bordered size="small">
      {_.map(value?.schemas, (schema, key) => {
        const limit = store.tenantInfo?.config?.[`limit.${key}`];
        const displayName = schema.info?.displayName;
        const title = displayName ? `${displayName} / ${key}` : key;
        const recordCount = store.tenantInfo?.recordCounts?.[key] ?? Number.NaN;
        const disable = recordCount >= limit || !store.tenantInfo?.tenant || !authorized;
        return (
          <Descriptions.Item label={title} key={title}>
            {limit ? `${recordCount} / ${limit}` : recordCount}
            <Divider dashed={true} style={{ margin: '0.5rem 0' }} />
            {key === store.tenantInfo?.config?.firstModelName ? (
              <Popconfirm
                title={
                  <>
                    创建 <b>{store.tenantInfo.config.firstDisplayName}</b> 后该 <b>微信号</b> 将与其绑定，是否确认？
                  </>
                }
                disabled={disable}
                onConfirm={() => createFirstModel(store.tenantInfo)}
              >
                <Button type="primary" size="small" disabled={disable}>
                  创建 {displayName || key}
                </Button>
              </Popconfirm>
            ) : (
              <Button size="small" onClick={() => ModelsHelper.openCreatePane(key)} disabled={disable}>
                创建 {displayName || key}
              </Button>
            )}
          </Descriptions.Item>
        );
      })}
    </Descriptions>
  ) : null;

  const helpInfo = !store.tenantInfo?.tenant && (
    <>
      {info}
      ，或
    </>
  );

  return (
    <div>
      {helpInfo}
      {contactInfo}
      <Divider type="horizontal" />
      {recordsInfo}
      {AppContext.isDebugMode && (
        <>
          <Divider />
          <pre>{util.inspect({ store }, { depth: 10 })}</pre>
        </>
      )}
    </div>
  );
};
