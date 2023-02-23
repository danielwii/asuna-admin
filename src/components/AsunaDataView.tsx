import { PageHeader } from '@ant-design/pro-layout';
import useLogger from '@danielwii/asuna-helper/dist/logger/hooks';

import { Button, Collapse, Descriptions, Empty, Tag, Tooltip } from 'antd';
import { Promise } from 'bluebird';
import * as _ from 'lodash';
import moment from 'moment';
import * as React from 'react';
import useAsync from 'react-use/lib/useAsync';
import { FoldingCube } from 'styled-spinkit';
import * as util from 'util';

import { WithDebugInfo } from '../helpers/debug';
import { useAsunaModels } from '../helpers/hooks';
import { ModelsHelper, resolveModelInPane } from '../helpers/models';
import { createLogger } from '../logger';
import { Asuna } from '../types';
import { DynamicFormTypes } from './DynamicForm/types';
import { AssetPreview, AssetsPreview } from './base/preview-button/asset-preview';

const logger = createLogger('components:data-view');

export interface DataViewColumnProps<EntitySchema> {
  title?: keyof EntitySchema;
  cover?: keyof EntitySchema;
}

export interface AsunaDataViewProps {
  data?: JSON;
  modelName: string;
  withActions?: boolean;
  extraName?: string;
  title?: string;
  cover?: string;
  onBack?: () => void;
}

export const AsunaDataView: React.FC<AsunaDataViewProps> = ({
  cover,
  title,
  modelName,
  extraName,
  onBack,
  data,
  withActions,
}) => {
  if (!data) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  const actions = withActions
    ? (text, record, extras) => (
        <span>
          <Button size="small" type="dashed" onClick={() => ModelsHelper.openEditPane(modelName, record)}>
            编辑
          </Button>
          {/*{extras && extras(auth)}*/}
          {/*          {editable ? (
            <Button size="small" type="dashed" onClick={() => _edit(text, record)}>
              Edit
            </Button>
          ) : (
            <Button size="small" type="dashed" onClick={() => onView!(text, record)} disabled={!onView}>
              View
            </Button>
          )}{' '}
          */}
          {/*
          {isDeletableSystemRecord(record) && deletable && (
            <>
              <Divider type="vertical" />
              <Button size="small" type="danger" onClick={() => _remove(text, record)}>
                Delete
              </Button>
            </>
          )}
*/}
        </span>
      )
    : null;

  const ctx: Asuna.Schema.TableContext = {
    onSearch: ({ searchText, searchedColumn }) => {
      logger.warn('onSearch', { searchText, searchedColumn });
    },
  };
  const { columnProps, relations, originSchemas } = useAsunaModels(modelName, { actions, extraName, ctx });
  const actionColumn = _.find(columnProps, (column) => column.key === 'action');
  const Content = ({ children, extra }) => {
    return (
      <div className="content" style={{ display: 'flex' }}>
        <div className="main">{children}</div>
        <div className="extra">{extra}</div>
      </div>
    );
  };

  const { modelConfig, primaryKey, columnOpts, schemas } = resolveModelInPane(modelName);
  const vars = {
    title: _.get(data, title || columnOpts?.columnProps?.dataView?.title || 'title'),
    id: _.get(data, primaryKey),
    cover: _.get(data, cover || columnOpts?.columnProps?.dataView?.cover || 'cover'),
    createdAt: _.get(data, 'createdAt'),
    updatedAt: _.get(data, 'updatedAt'),
    updatedBy: _.get(data, 'updatedBy'),
  };
  const leftVars = _.omit(data, _.flatten([_.keys(vars), primaryKey, relations]) as string[]);
  const publishedTag = _.has(data, 'isPublished')
    ? renderValue({ value: data['isPublished'], textFn: (value) => (value ? '已发布' : '未发布') })
    : null;

  const customColumnOpts = useAsync(
    async () => await Promise.props(_.mapValues(columnOpts?.customColumns, (columnOpt) => (columnOpt as any)())),
    [columnOpts?.customColumns],
  );

  /*
  const CustomColumnsFuture = React.lazy(
    () =>
      new Promise(resolve => {
        bluebird.props(_.mapValues(columnOpts?.customColumns, columnOpt => (columnOpt as any)())).then(columnOpts => {
          resolve({
            default: () =>
              _.map(columnOpts, (columnOpt, label) => {
                return (
                  <Descriptions.Item key={columnOpt.key} label={columnOpt.title}>
                    <WithDebugInfo info={{ label, columnOpt }}>
                      <div>value: {_.get(data, columnOpt.key)}</div>
                      <pre>{util.inspect({ label, columnOpt })}</pre>
                    </WithDebugInfo>
                    {/!*{renderValue({ value, type: schemas[label]?.type })}*!/}
                  </Descriptions.Item>
                );
              }),
          } as any);
        });
      }),
  );

  <Suspense fallback={<div>Loading...</div>}>
    <CustomColumnsFuture />
  </Suspense>
*/

  useLogger('<[AsunaDataView]>', { vars, leftVars, columnOpts, customColumnOpts });

  return (
    <div>
      {/*<pre>{util.inspect(_.omit(originSchemas, 'columns'), { depth: 10 })}</pre>*/}
      {/*<pre>{util.inspect(data)}</pre>*/}
      {/*<pre>{util.inspect(schemas)}</pre>*/}
      {/*<pre>{util.inspect(relations)}</pre>*/}
      {/*<pre>{util.inspect(columnOpts)}</pre>*/}
      {/*<pre>{util.inspect(customColumnOpts)}</pre>*/}

      <PageHeader
        style={{ border: '1px solid rgb(235, 237, 240)' }}
        onBack={onBack && data ? () => onBack() : undefined}
        title={vars.title}
        subTitle={`#${vars.id}`}
        tags={publishedTag as any}
        // tags={[<>{publishedTag}</>]}
        {...(vars.cover ? { avatar: { src: vars.cover, size: 'large' } } : null)}
        extra={actionColumn?.render?.(data, data, 0) as any}
        // extra={[
        //   actionColumn?.render?.(data, data, 0),
        //   // <Button key="3">Operation</Button>,
        //   // <Button key="2">Operation</Button>,
        //   // <Button key="1" type="primary">Primary</Button>,
        // ]}
        // footer={
        //   <Tabs>
        //     {_.map(originSchemas?.oneToManyRelations, relation => (
        //       <TabPane tab={relation.name} key={relation.name}>
        //         <pre>{util.inspect(relation)}</pre>
        //       </TabPane>
        //     ))}
        //     {/*<TabPane tab="Details" key="1">details</TabPane>*/}
        //     {/*<TabPane tab="Rule" key="2">rule</TabPane>*/}
        //   </Tabs>
        // }
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
                {/*<pre>{util.inspect(columnOpts)}</pre>*/}
                {/*<Statistic title="isPublished" value="Pending" style={{ marginRight: 32 }} />*/}
                {/*<Statistic title="Price" prefix="$" value={568.08} />*/}
              </div>
            </>
          }
        >
          <Descriptions size="small" column={2}>
            <Descriptions.Item label="创建时间" key="createdAt">
              <Tooltip title={vars.createdAt}>
                <>
                  {moment(vars.createdAt).calendar()}
                  <div>{moment(vars.createdAt).fromNow()}</div>
                </>
              </Tooltip>
            </Descriptions.Item>
            <Descriptions.Item label="更新时间" key="updatedAt">
              <Tooltip title={vars.updatedAt}>
                <>
                  {moment(vars.updatedAt).calendar()}
                  <div>{moment(vars.updatedAt).fromNow()}</div>
                </>
              </Tooltip>
            </Descriptions.Item>

            {_.map(leftVars, (value, label: string) => {
              const schemaLabel = _.get(schemas, `${label}.options.label`, '') || label;
              return (
                <Descriptions.Item key={label} label={schemaLabel as any}>
                  <WithDebugInfo info={{ schema: schemas[label], value }}>
                    {renderValue({ value, type: schemas[label]?.type })}
                  </WithDebugInfo>
                </Descriptions.Item>
              );
            })}

            {customColumnOpts.loading ? (
              <FoldingCube />
            ) : (
              _.map(customColumnOpts.value, (columnOpt, label) => (
                <Descriptions.Item key={columnOpt.key} label={columnOpt.title}>
                  {columnOpt.render(data[columnOpt.relation], data[columnOpt.relation], 0)}
                  <WithDebugInfo info={{ label, columnOpt }}>
                    {/*<div>value: {_.get(data, columnOpt.key)}</div>*/}
                    {/*<pre>{util.inspect({ label, columnOpt })}</pre>*/}
                    {columnOpt.render(data, data, 0)}
                  </WithDebugInfo>
                </Descriptions.Item>
              ))
            )}
          </Descriptions>
        </Content>
        <Collapse bordered={false}>
          {/*<Panel header="This is panel header 1" key="1">{text}</Panel>*/}
          {/*<Panel header="This is panel header 2" key="2">{text}</Panel>*/}
          {/*<Panel header="This is panel header 3" key="3">{text}</Panel>*/}
        </Collapse>
      </PageHeader>
    </div>
  );
};

function renderValue({
  value,
  textFn,
  type,
}: {
  value: any;
  textFn?: (value) => string;
  type?: DynamicFormTypes;
}): React.ReactElement {
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
  } else if (type === DynamicFormTypes.Image) {
    return <AssetPreview url={value} />;
  } else if (type === DynamicFormTypes.Images) {
    return <AssetsPreview urls={value} />;
  } else if (_.isDate(value) || type === DynamicFormTypes.Date || type === DynamicFormTypes.DateTime) {
    return (
      <Tooltip title={value}>
        <>
          {moment(value).calendar()}
          <div>{moment(value).fromNow()}</div>
        </>
      </Tooltip>
    );
  } else if (_.isNull(value)) {
    return <Tag>null</Tag>;
  } else if (_.isObject(value)) {
    return <pre>{util.inspect({ value, type })}</pre>;
  }
  return value;
}
