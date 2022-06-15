import { Button, Col, Descriptions, Divider, Popconfirm, Row, Statistic } from 'antd';
import { Promise } from 'bluebird';
import * as _ from 'lodash';
import React, { useContext, useState } from 'react';
import { useAsync } from 'react-use';
import { FoldingCube } from 'styled-spinkit';
import * as util from 'util';

import { TenantInfo } from '../adapters/admin.plain';
import { DynamicFormTypes } from '../components/DynamicForm/types';
import { FormModalButton } from '../components/FormModalButton';
import { ErrorInfo } from '../components/base/error';
import { StoreContext } from '../context/store';
import { AppContext } from '../core/context';
import { DebugInfo } from '../helpers/debug';
import { parseResponseError } from '../helpers/error';
import { ModelsHelper } from '../helpers/models';
import { TenantHelper } from '../helpers/tenant';
import { createLogger } from '../logger';

import type { Asuna } from '../types';

const logger = createLogger('tenant:welcome');

async function createFirstModel(tenantInfo?: TenantInfo): Promise<void> {
  // TODO add validation info to error or console box (not implemented yet).
  if (tenantInfo?.config?.firstModelName) {
    return ModelsHelper.openCreatePane(tenantInfo?.config.firstModelName);
  }
}

export const TenantWelcome: React.VFC = (props) => {
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

  // if (AppContext.isDebugMode) useLogger('TenantWelcome', props, { count, store, value });

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
        openButton={(open) => (
          <Button size="small" type="dashed" onClick={open}>
            {label}
          </Button>
        )}
        onSubmit={({ name, description }) => {
          const payload =
            store.tenantInfo?.config?.firstModelBind && store.tenantInfo?.config?.firstModelField
              ? { title: name }
              : null;
          return AppContext.ctx.admin.registerTenant({ name, description, payload }).then(() => location.reload());
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
        const { limit, published, total } = TenantHelper.resolveCount(key);
        const displayName = schema.info?.displayName;
        const title = displayName || key; // displayName ? `${displayName} / ${key}` : key;
        const disable = total >= limit || !store.tenantInfo?.tenant || !authorized;
        return (
          <Descriptions.Item label={title} key={title}>
            <Row gutter={8}>
              {published ? (
                <>
                  <Col>
                    <Statistic
                      title="已发布"
                      valueStyle={{ color: '#3f8600' }}
                      // prefix={recordCount.published}
                      value={published}
                      // suffix={`/ ${recordCount.total}`}
                    />
                  </Col>
                  <Col>
                    <Statistic
                      title="未发布"
                      valueStyle={{ color: '#8e8e8e' }}
                      // prefix={recordCount.published}
                      value={total - published}
                      // suffix={`/ ${recordCount.total}`}
                    />
                  </Col>
                </>
              ) : (
                total
              )}
              {limit ? (
                <Col>
                  <Statistic
                    title="总共 / 限制"
                    valueStyle={total >= limit ? { color: '#cf1322' } : {}}
                    value={total}
                    suffix={`/ ${limit}`}
                  />
                </Col>
              ) : (
                <Col>
                  <Statistic
                    title="总共"
                    // valueStyle={recordCount.total >= limit ? { color: '#cf1322' } : {}}
                    value={total}
                  />
                </Col>
              )}
            </Row>
            <Divider dashed style={{ margin: '0.5rem 0' }} />
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
