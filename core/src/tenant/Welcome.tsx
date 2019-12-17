import { adminProxyCaller, TenantInfo } from '@asuna-admin/adapters';
import { ErrorInfo } from '@asuna-admin/components';
import { AppContext } from '@asuna-admin/core';
import { ModelsHelper, TenantHelper } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';
import { Button, Divider, message, Popconfirm } from 'antd';
import { Promise } from 'bluebird';
import React, { useDebugValue } from 'react';
import { useAsync } from 'react-use';
import { FoldingCube } from 'styled-spinkit';
import * as util from 'util';

const logger = createLogger('tenant:welcome');

async function createProjectAndTenant(tenantInfo: TenantInfo): Promise<void> {
  if (!tenantInfo.tenant) {
    await adminProxyCaller().ensureTenant();
  }
  // TODO add validation info to error or console box (not implemented yet).
  if (tenantInfo.config?.firstModelName) {
    ModelsHelper.openCreatePane(tenantInfo.config.firstModelName);
  }
}

export const TenantWelcome: React.FC<{ tenantInfo: TenantInfo }> = ({ tenantInfo }) => {
  const { value, error, loading } = useAsync(async () => {
    return Promise.props({
      // tenantInfo: adminProxyCaller().tenantInfo(),
    });
  });
  // const securityState = useSelector<RootState, SecurityState>(state => state.security);

  if (loading) return <FoldingCube />;
  if (error)
    return (
      <ErrorInfo>
        <pre>{util.inspect(error)}</pre>
      </ErrorInfo>
    );

  const info = tenantInfo.config?.enabled ? (
    <>
      创建{' '}
      <Popconfirm
        title={
          <>
            创建 <b>{tenantInfo.config.firstDisplayName}</b> 后该 <b>微信号</b> 将与其绑定，是否确认？
          </>
        }
        onConfirm={() => createProjectAndTenant(tenantInfo)}
      >
        <Button type="dashed" size="small">
          {tenantInfo.config.firstDisplayName}
        </Button>
      </Popconfirm>
    </>
  ) : (
    'Welcome'
  );

  return (
    <div>
      {info}
      ，或如需帮助，请联系
      <Button type="link" size="small">
        管理员
      </Button>
      。
      {AppContext.isDebugMode && (
        <>
          <Divider />
          <pre>{util.inspect({ tenantInfo, value }, { depth: 10 })}</pre>
        </>
      )}
    </div>
  );
};
