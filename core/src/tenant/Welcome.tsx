import { adminProxyCaller, TenantInfo } from '@asuna-admin/adapters';
import { DynamicFormTypes, ErrorInfo, FormModalButton } from '@asuna-admin/components';
import { StoreContext } from '@asuna-admin/context/store';
import { AppContext } from '@asuna-admin/core';
import { ModelsHelper, parseResponseError, TenantHelper } from '@asuna-admin/helpers';
import { DebugInfo } from '@asuna-admin/helpers/debug';
import { createLogger } from '@asuna-admin/logger';
import { Asuna } from '@asuna-admin/types';
import { Button, Col, Descriptions, Divider, Popconfirm, Row, Statistic } from 'antd';
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

  const label = store.tenantInfo?.config?.firstModelBind ? store.tenantInfo?.config?.firstDisplayName : '账户';

  const info = store.tenantInfo?.config?.enabled ? (
    <>
      绑定{' '}
      <FormModalButton
        title={`绑定${label}`}
        onRefresh={() => reload(count + 1)}
        openButton={open => (
          <Button size="small" type="dashed" onClick={open}>
            {label}
          </Button>
        )}
        onSubmit={({ name, description }) => {
          const payload =
            store.tenantInfo?.config?.firstModelBind && store.tenantInfo?.config?.firstModelField
              ? { title: name }
              : null;
          return adminProxyCaller()
            .registerTenant({ name, description, payload })
            .then(() => location.reload());
        }}
        fields={{
          name: { name: 'name', type: DynamicFormTypes.Input, options: { required: true, name: `${label}名称` } },
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
        const title = displayName || key; //displayName ? `${displayName} / ${key}` : key;
        const recordCount = store.tenantInfo?.recordCounts?.[key] ?? { total: 0 };
        const disable = recordCount.total >= limit || !store.tenantInfo?.tenant || !authorized;
        return (
          <Descriptions.Item label={title} key={title}>
            <Row gutter={8} type="flex">
              {_.has(recordCount, 'published') ? (
                <>
                  <Col>
                    <Statistic
                      title="已发布"
                      valueStyle={{ color: '#3f8600' }}
                      // prefix={recordCount.published}
                      value={recordCount.published}
                      // suffix={`/ ${recordCount.total}`}
                    />
                  </Col>
                  <Col>
                    <Statistic
                      title="未发布"
                      valueStyle={{ color: '#8e8e8e' }}
                      // prefix={recordCount.published}
                      value={recordCount.total - (recordCount.published ?? 0)}
                      // suffix={`/ ${recordCount.total}`}
                    />
                  </Col>
                </>
              ) : (
                recordCount.total
              )}
              {limit ? (
                <Col>
                  <Statistic
                    title="总共 / 限制"
                    valueStyle={recordCount.total >= limit ? { color: '#cf1322' } : {}}
                    value={recordCount.total}
                    suffix={`/ ${limit}`}
                  />
                </Col>
              ) : (
                <Col>
                  <Statistic
                    title="总共"
                    // valueStyle={recordCount.total >= limit ? { color: '#cf1322' } : {}}
                    value={recordCount.total}
                  />
                </Col>
              )}
            </Row>
            <Divider dashed={true} style={{ margin: '0.5rem 0' }} />
            {key === store.tenantInfo?.config?.firstModelName ? (
              <Popconfirm
                title={
                  <>
                    创建 <b>{store.tenantInfo?.config?.firstDisplayName}</b> 后该 <b>微信号</b> 将与其绑定，是否确认？
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
      <DebugInfo data={{ store, value }} divider />
    </div>
  );
};
