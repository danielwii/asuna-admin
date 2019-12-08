import { AssetsPreview } from '@asuna-admin/components';
import { AppContext, useAsunaModels } from '@asuna-admin/core';
import { resolveModelInPane } from '@asuna-admin/helpers';
import moment from 'moment';
import React from 'react';
import { Button, Collapse, Descriptions, Empty, PageHeader, Statistic, Switch, Tabs, Tag, Tooltip } from 'antd';
import util from 'util';
import _ from 'lodash';

const { Panel } = Collapse;
const { TabPane } = Tabs;

const text = (
  <p style={{ paddingLeft: 24 }}>
    A dog is a type of domesticated animal. Known for its loyalty and faithfulness, it can be found as a welcome guest
    in many households across the world.
  </p>
);

export interface AsunaDataViewProps {
  modelName: string;
  cover?: string;
  data: JSON;
  onBack?: () => void;
}

export const AsunaDataView: React.FC<AsunaDataViewProps> = props => {
  const { cover = 'cover', modelName, onBack, data } = props;

  if (!data) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  const { columns, relations } = useAsunaModels(modelName);
  const Content = ({ children, extra }) => {
    return (
      <div className="content" style={{ display: 'flex' }}>
        <div className="main">{children}</div>
        <div className="extra">{extra}</div>
      </div>
    );
  };

  const { modelConfig, primaryKey, tableColumnOpts, schema } = resolveModelInPane(modelName);
  const vars = {
    title: _.get(data, 'title'),
    id: _.get(data, primaryKey),
    cover: _.get(data, cover),
    createdAt: _.get(data, 'createdAt'),
    updatedAt: _.get(data, 'updatedAt'),
    updatedBy: _.get(data, 'updatedBy'),
  };
  const leftVars = _.omit(data, [primaryKey, cover, 'title', 'createdAt', 'updatedAt', 'updatedBy']);
  const publishedTag = _.has(data, 'isPublished')
    ? renderValue(data['isPublished'], value => (value ? '已发布' : '未发布'))
    : null;

  return (
    <div>
      <pre>{util.inspect({ data, schema, columns, relations })}</pre>

      <PageHeader
        style={{ border: '1px solid rgb(235, 237, 240)' }}
        onBack={onBack && data ? () => onBack() : undefined}
        title={vars.title}
        subTitle={`#${vars.id}`}
        tags={[<>{publishedTag}</>]}
        {...(vars.cover ? { avatar: { src: vars.cover } } : null)}
        extra={[
          <Button key="3">Operation</Button>,
          <Button key="2">Operation</Button>,
          <Button key="1" type="primary">
            Primary
          </Button>,
        ]}
        footer={
          <Tabs defaultActiveKey="1">
            <TabPane tab="Details" key="1">
              details
            </TabPane>
            <TabPane tab="Rule" key="2">
              rule
            </TabPane>
          </Tabs>
        }
      >
        <Content
          extra={
            <>
              <div>{vars.cover && <AssetsPreview urls={[vars.cover]} />}</div>
              <div
                style={{
                  display: 'flex',
                  width: 'max-content',
                  justifyContent: 'flex-end',
                }}
              >
                {/*<Statistic title="isPublished" value="Pending" style={{ marginRight: 32 }} />*/}
                {/*<Statistic title="Price" prefix="$" value={568.08} />*/}
              </div>
            </>
          }
        >
          <Descriptions size="small" column={2}>
            <Descriptions.Item label="创建时间">
              <Tooltip title={vars.createdAt}>
                {moment(vars.createdAt).calendar()}
                <div>{moment(vars.createdAt).fromNow()}</div>
              </Tooltip>
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              <Tooltip title={vars.updatedAt}>
                {moment(vars.updatedAt).calendar()}
                <div>{moment(vars.updatedAt).fromNow()}</div>
              </Tooltip>
            </Descriptions.Item>
            {_.map(leftVars, (value, label: string) => {
              const schemaLabel = _.get(schema, `${label}.options.label`, '') || label;
              return (
                <Descriptions.Item
                  key={label}
                  label={schemaLabel === label ? label : `${schemaLabel || label} / ${label}`}
                >
                  {renderValue(value)}
                </Descriptions.Item>
              );
            })}
          </Descriptions>
        </Content>
        <Collapse bordered={false} defaultActiveKey={['1']}>
          <Panel header="This is panel header 1" key="1">
            {text}
          </Panel>
          <Panel header="This is panel header 2" key="2">
            {text}
          </Panel>
          <Panel header="This is panel header 3" key="3">
            {text}
          </Panel>
        </Collapse>
      </PageHeader>
    </div>
  );
};

function renderValue(value: any, textFn?: (value) => string): React.ReactChild {
  const text = textFn ? textFn(value) : value;
  if (typeof value === 'boolean') {
    // return <Switch checked={value} onClick={undefined} size="small" />;
    return value ? <Tag color="green">{`${text}`}</Tag> : <Tag color="red">{`${text}`}</Tag>;
    /*
    return (
      <>
        <Switch checked={value} onClick={undefined} />
        <Tag color="blue">已发布</Tag>
        <Tag>未发布</Tag>
        <Tag color="red">未发布</Tag>
      </>
    );
*/
  }
  return value;
}
