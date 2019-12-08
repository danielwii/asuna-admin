import { responseProxy } from '@asuna-admin/adapters';
import { AppContext, useAsunaModels } from '@asuna-admin/core';
import { castModelKey, parseJSONIfCould, resolveModelInPane } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';
import { contentActions, modelsActions, panesActions } from '@asuna-admin/store';
import { Asuna } from '@asuna-admin/types';
import { Button, Divider, Dropdown, Menu, Modal, Switch, Table, Tag } from 'antd';
import { PaginationConfig } from 'antd/es/pagination';
import { SorterResult } from 'antd/es/table';
import { TableCurrentDataSource } from 'antd/lib/table/interface';
import _ from 'lodash';
import * as R from 'ramda';
import React, { useState } from 'react';

const logger = createLogger('components:data-table');

export interface AsunaDataTableProps {
  creatable?: Asuna.Schema.TableColumnOptCreatable;
  editable?: boolean;
  deletable?: boolean;
  opts?: Asuna.Schema.TableColumnOpts<any>;
  rowClassName?: (record: any, index: number) => string;
  models: any;
  modelName: string;
  onView?: (text: any, record: any) => void;
}

export const AsunaDataTable: React.FC<AsunaDataTableProps> = props => {
  const {
    creatable = false,
    editable = false,
    deletable = false,
    opts,
    rowClassName,
    models,
    modelName,
    onView,
  } = props;
  const [queryCondition, setQueryCondition] = useState<{
    pagination?: PaginationConfig;
    filters?: Record<any, string[]>;
    sorter?: SorterResult<any>;
  }>({});
  // 用于刷新页面的一个标记
  const [flag, updateFlag] = useState(0);

  const _refresh = () => {
    _handleTableChange(queryCondition.pagination, queryCondition.filters, queryCondition.sorter);
  };
  const actions = (text, record, extras) => (
    <span>
      {/*{extras && extras(auth)}*/}
      {editable ? (
        <Button size="small" type="dashed" onClick={() => _edit(text, record)}>
          Edit
        </Button>
      ) : (
        <Button size="small" type="dashed" onClick={() => onView!(text, record)} disabled={!onView}>
          View
        </Button>
      )}{' '}
      {isDeletableSystemRecord(record) && deletable && (
        <>
          <Divider type="vertical" />
          <Button size="small" type="danger" onClick={() => _remove(text, record)}>
            Delete
          </Button>
        </>
      )}
    </span>
  );

  const { columns, relations } = useAsunaModels(modelName, { callRefresh: _refresh, extraName: modelName, actions });

  const { modelConfig, primaryKey, tableColumnOpts } = resolveModelInPane(modelName);
  const _pinActions = () => {
    const column = _.find(columns, column => column.key === 'action');
    if (column) {
      if (_.has(column, 'fixed')) {
        delete column['fixed'];
        delete column['width'];
      } else {
        column['fixed'] = 'right';
        column['width'] = 250;
      }
    }
    updateFlag(flag + 1);
  };
  const isDeletableSystemRecord = record => !record[castModelKey('isSystem')];
  const _create = () => {
    AppContext.dispatch(
      panesActions.open({
        key: `content::upsert::${modelName}::${Date.now()}`,
        title: `new - ${modelName}`,
        linkTo: 'content::upsert',
      }),
    );
  };
  const _edit = (text, record) => {
    logger.log('[edit]', { text, record });
    AppContext.dispatch(
      panesActions.open({
        key: `content::upsert::${modelName}::${record.id}`,
        title: `view - ${modelName} - ${record.name || ''}`,
        linkTo: 'content::upsert',
        data: { modelName, record },
      }),
    );
  };
  const _remove = (text, record) => {
    logger.log('[remove]', record);
    const modal = Modal.confirm({
      title: '是否确认',
      content: `删除 ${modelName}？`,
      okText: '确认',
      cancelText: '取消',
      onOk: () =>
        AppContext.dispatch(
          modelsActions.remove(modelName, record, response => {
            if (/^20\d$/.test(response.status)) modal.destroy();
          }),
        ),
    });
  };
  const _transformFilters = (filters?: Record<keyof any, string[]>) => {
    return _.chain(filters)
      .mapKeys((filterArr, key) =>
        key.includes('.') && _.isString(_.head(filterArr)) ? _.get(parseJSONIfCould(_.head(filterArr)), 'key') : key,
      )
      .mapValues((filterArr, key) =>
        key.includes('.') && _.isString(_.head(filterArr))
          ? _.get(parseJSONIfCould(_.head(filterArr)), 'value')
          : filterArr,
      )
      .value();
  };
  const _import = () => {
    // TODO not implemented
    // AppContext.adapters.api.import();
  };
  const _export = () => {
    // TODO not implemented
    // AppContext.adapters.api.export();
  };
  const _handleTableChange = (
    pagination?: PaginationConfig,
    filters?: Record<keyof any, string[]>,
    sorter?: SorterResult<any>,
    extra?: TableCurrentDataSource<any>,
  ): void => {
    logger.debug('[handleTableChange]', { pagination, filters, sorter, extra });
    // using state sorter if no sorter found in parameters
    const availableSorter = sorter && _.isEmpty(sorter) ? queryCondition.sorter : sorter;
    const transformedSorter =
      availableSorter && !_.isEmpty(availableSorter)
        ? ({ [availableSorter.field as string]: _.slice(availableSorter.order, 0, -3).join('') } as Sorter)
        : null;
    // { 'ref.name': '{ 'ref.id': 'idxxxx' }' } -> { 'ref.id': 'idxxxxx' }
    const transformedFilters = _transformFilters(filters);

    logger.debug('[handleTableChange]', { availableSorter, transformedSorter, transformedFilters });
    AppContext.dispatch(
      contentActions.loadModels(modelName, {
        relations,
        filters: transformedFilters,
        pagination,
        sorter: transformedSorter,
      } as any),
    );
    setQueryCondition({
      pagination,
      filters,
      // 在 sorter 为空时使用默认的 id desc 排序
      sorter: _.isEmpty(sorter) ? availableSorter : sorter,
    });
  };

  const actionColumn = _.find(columns, column => column.key === 'action');
  const response = R.pathOr([], [modelName, 'data'])(models);
  const loading = R.pathOr(false, [modelName, 'loading'])(models);

  const { items: dataSource, pagination } = responseProxy.extract(response);

  return (
    <>
      {/*<pre>{util.inspect(columns)}</pre>*/}

      {creatable && (
        <React.Fragment>
          <Button type={'primary'} onClick={() => (_.isFunction(creatable) ? creatable(modelName) : _create())}>
            Create
          </Button>
          <Divider type="vertical" />
        </React.Fragment>
      )}
      <Button onClick={_refresh}>刷新</Button>

      <Divider type="vertical" />

      {/* TODO 导入导出按钮，目前接口已经实现，但是暂未集成 */}
      <Button.Group>
        <Button onClick={_import} disabled={true}>
          导入
        </Button>
        <Button onClick={_export} disabled={true}>
          导出
        </Button>
      </Button.Group>

      <Divider type="vertical" />

      <Dropdown
        overlay={
          <Menu>
            <Menu.Item onClick={_pinActions}>
              <Switch size={'small'} checked={!!_.get(actionColumn, 'fixed')} />
              <Divider type="vertical" />
              固定 Actions
            </Menu.Item>
          </Menu>
        }
        placement="bottomCenter"
      >
        <Button>布局</Button>
      </Dropdown>

      <Divider type="vertical" />

      {opts && opts.renderActions && (
        <>
          {opts.renderActions({ modelName, callRefresh: _refresh })}
          <Divider type="vertical" />
        </>
      )}
      {opts && opts.renderHelp && (
        <Button
          type="dashed"
          shape="circle"
          icon="info"
          size="small"
          onClick={() => Modal.info({ width: '60%', content: opts.renderHelp })}
        />
      )}
      <Divider type="horizontal" style={{ margin: '0.5rem 0' }} />

      {!_.isEmpty(queryCondition.filters) && (
        <>
          {_.map(_transformFilters(queryCondition.filters), (filter, key) =>
            !_.isEmpty(filter) ? (
              <Tag
                key={`tag-${key}`}
                closable
                color="geekblue"
                onClose={() => {
                  // 重置 filteredValue 用于刷新 table
                  // const column = _.find(columns, column => column.key === key);
                  // if (column) column.filteredValue = null;

                  const filters = _.omit(queryCondition.filters, key);
                  setQueryCondition({ pagination: queryCondition.pagination, filters, sorter: queryCondition.sorter });
                  _handleTableChange(queryCondition.pagination, filters);
                  updateFlag(flag + 1);
                }}
              >
                {key}: {JSON.stringify(filter)}
              </Tag>
            ) : null,
          )}
          <Divider type="horizontal" style={{ margin: '0.5rem 0' }} />
        </>
      )}

      {columns && (
        <Table
          key={`table-${flag}`}
          size={'small'}
          className="asuna-content-table"
          scroll={{ x: true }}
          dataSource={dataSource}
          rowKey={primaryKey}
          loading={loading}
          columns={columns}
          pagination={{ ...pagination, position: 'both' }}
          onChange={_handleTableChange}
          rowClassName={rowClassName}
        />
      )}
      {/* language=CSS */}
      <style jsx global>{`
        .ant-tabs {
          overflow: inherit !important;
        }
      `}</style>
    </>
  );
};
