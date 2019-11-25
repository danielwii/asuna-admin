import { responseProxy } from '@asuna-admin/adapters';
import { Config } from '@asuna-admin/config';
import { ActionEvent, AppContext, EventBus, EventType } from '@asuna-admin/core';
import { castModelKey, diff } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';
import { contentActions, modelsActions, panesActions, RootState } from '@asuna-admin/store';
import { Asuna } from '@asuna-admin/types';

import { Button, Divider, Modal, Table } from 'antd';
import { PaginationConfig } from 'antd/es/pagination';
import { ColumnProps, SorterResult } from 'antd/es/table';
import idx from 'idx';
import _ from 'lodash';
import * as R from 'ramda';
import React from 'react';
import { connect } from 'react-redux';
import { Subscription } from 'rxjs';

const logger = createLogger('modules:content:index');

interface IProps extends ReduxProps {
  basis: { pane: { key: string } };
  activeKey: string;
  models: object;
  nextGetConfig: any;
}

interface IState {
  key: string;
  primaryKey: string;
  modelName: string;
  extraName: string;
  relations?: string[];
  /**
   * 不为 true 时页面不显示新建按钮
   */
  creatable: Asuna.Schema.TableColumnOptCreatable;
  editable: boolean;
  deletable: boolean;
  columns?: (ColumnProps<any> & { relation: any })[];
  pagination?: PaginationConfig;
  filters?: Record<any, string[]>;
  sorter?: Partial<SorterResult<any>>;
  subscription: Subscription;
  busSubscription: Subscription;
  hasGraphAPI?: string;

  opts?: Asuna.Schema.TableColumnOpts<any>;
}

class ContentIndex extends React.Component<IProps, IState> {
  private modelsAdapter = AppContext.adapters.models;

  constructor(props) {
    super(props);

    const { basis, activeKey } = this.props;

    logger.debug('[constructor]', { basis });

    // content::name => name
    const matched = _.get(basis, 'pane.key').match(/^\w+::(\w+).*$/);
    const extraName = matched ? matched[1] : null;
    const modelName = _.get(basis, 'pane.model') || extraName;
    const modelConfig = this.modelsAdapter.getModelConfig(modelName);
    const tableColumnOpts = this.modelsAdapter.getTableColumnOpts(extraName);
    const primaryKeys = this.modelsAdapter.getPrimaryKeys(modelName);
    const primaryKey = _.head(primaryKeys) || 'id';

    const creatableOpt = idx(tableColumnOpts, _ => _.creatable);
    const creatable = _.isFunction(creatableOpt)
      ? creatableOpt
      : modelConfig.creatable !== false && creatableOpt !== false;
    const deletable = idx(tableColumnOpts, _ => _.deletable) !== false;
    const editable = idx(tableColumnOpts, _ => _.editable) !== false;

    logger.debug(
      '[constructor]',
      { modelConfig, modelName, primaryKeys, extraName, tableColumnOpts },
      { creatable, editable, deletable },
    );
    const sorter: Partial<SorterResult<any>> = {
      columnKey: _.first(primaryKeys),
      field: _.first(primaryKeys),
      order: 'descend',
    };
    const orderBy = Config.get('TABLE_DEFAULT_ORDER_BY');
    if (!_.isEmpty(orderBy) && orderBy !== 'byPrimaryKey') {
      sorter['columnKey'] = castModelKey(orderBy);
      sorter['field'] = castModelKey(orderBy);
    }
    this.state = {
      primaryKey,
      extraName,
      modelName,
      creatable,
      editable,
      deletable,
      key: activeKey,
      opts: tableColumnOpts || undefined,
      sorter,
      subscription: AppContext.subject.subscribe({
        next: action => {
          // logger.log('[observer-content-index]', { modelName, activeKey, action });
        },
      }),
      busSubscription: EventBus.observable.subscribe({
        next: (action: ActionEvent) => {
          if (
            _.includes([EventType.MODEL_INSERT, EventType.MODEL_UPDATE], action.type) &&
            action.payload.modelName === modelName
          ) {
            logger.log('[bus-content-index]', { modelName, activeKey, action });
            this._refresh();
          }
        },
      }),
    };
  }

  async componentDidMount() {
    const { creatable, editable, deletable, modelName, extraName } = this.state;
    const isDeletableSystemRecord = record => !record[castModelKey('isSystem')];
    const actions = (text, record, extras) => (
      <span>
        {/*{extras && extras(auth)}*/}
        {editable ? (
          <Button size="small" type="dashed" onClick={() => this._edit(text, record)}>
            Edit
          </Button>
        ) : (
          <Button size="small" type="dashed" onClick={() => /*view*/ this._edit(text, record)} disabled={true}>
            View
          </Button>
        )}{' '}
        {isDeletableSystemRecord(record) && deletable && (
          <>
            <Divider type="vertical" />
            <Button size="small" type="danger" onClick={() => this._remove(text, record)}>
              Delete
            </Button>
          </>
        )}
      </span>
    );

    // prettier-ignore
    const columns = await this.modelsAdapter.getColumns(modelName, {
      callRefresh: this._refresh,
      actions,
    }, extraName);
    // prettier-ignore
    const relations = R.compose(
      R.filter(R.compose(R.not, R.isEmpty)),
      R.map(R.values),
      R.map(R.pick(['relation'])),
    )(columns);

    const hasGraphAPI = _.find(await AppContext.ctx.graphql.loadGraphs(), schema => schema === `sys_${modelName}`);

    logger.debug('[componentDidMount]', { columns, relations });
    this.setState({ hasGraphAPI, columns, relations });

    const { pagination, filters, sorter } = this.state;
    this._handleTableChange(pagination, filters, sorter);
  }

  componentWillUnmount() {
    logger.log('[componentWillUnmount]', 'destroy subscriptions');
    this.state.subscription.unsubscribe();
    this.state.busSubscription.unsubscribe();
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    logger.debug('[shouldComponentUpdate]', { nextProps, nextState, nextContext });
    const { key } = this.state;
    const { activeKey } = nextProps;
    const samePane = key === activeKey;
    const propsDiff = diff(this.props, nextProps);
    const shouldUpdate = samePane && propsDiff.isDifferent;
    logger.debug('[shouldComponentUpdate]', { key, activeKey, samePane, shouldUpdate, propsDiff });
    return shouldUpdate;
  }

  _create = () => {
    const { modelName } = this.state;
    const { dispatch } = this.props;
    dispatch(
      panesActions.open({
        key: `content::upsert::${modelName}::${Date.now()}`,
        title: `new - ${modelName}`,
        linkTo: 'content::upsert',
      }),
    );
  };

  _view = (text, record) => {
    logger.log('[view]', { text, record });
  };

  _edit = (text, record) => {
    logger.log('[edit]', { text, record });
    const { modelName } = this.state;
    const { dispatch } = this.props;
    dispatch(
      panesActions.open({
        key: `content::upsert::${modelName}::${record.id}`,
        title: `view - ${modelName} - ${record.name || ''}`,
        linkTo: 'content::upsert',
        data: { modelName, record },
      }),
    );
  };

  _remove = (text, record) => {
    logger.log('[remove]', record);
    const { modelName } = this.state;
    const { dispatch } = this.props;
    const modal = Modal.confirm({
      title: '是否确认',
      content: `删除 ${modelName}？`,
      okText: '确认',
      cancelText: '取消',
      onOk: () =>
        dispatch(
          modelsActions.remove(modelName, record, response => {
            if (/^20\d$/.test(response.status)) modal.destroy();
          }),
        ),
    });
  };

  _handleTableChange = (pagination, filters, sorter) => {
    logger.debug('[handleTableChange]', { pagination, filters, sorter });
    const { modelName, relations } = this.state;
    const { dispatch } = this.props;
    // using state sorter if no sorter found in parameters
    const availableSorter = _.isEmpty(sorter) ? this.state.sorter : sorter;
    const transformedSorter = !_.isEmpty(availableSorter)
      ? ({ [availableSorter.field]: availableSorter.order.slice(0, -3) } as Sorter)
      : null;

    logger.debug('[handleTableChange]', { availableSorter, transformedSorter });
    dispatch(
      contentActions.loadModels(modelName, {
        relations,
        filters,
        pagination,
        sorter: transformedSorter,
      }),
    );
    this.setState({
      pagination,
      filters,
      // 在 sorter 为空时使用默认的 id desc 排序
      sorter: _.isEmpty(sorter) ? availableSorter : sorter,
    });
  };

  _refresh = () => {
    const { pagination, filters, sorter } = this.state;
    this._handleTableChange(pagination, filters, sorter);
  };

  _import = () => {
    // TODO not implemented
    // AppContext.adapters.api.import();
  };

  _export = () => {
    // TODO not implemented
    // AppContext.adapters.api.export();
  };

  render() {
    const { extraName, modelName, columns, creatable, opts } = this.state;

    const { models } = this.props;

    const response = R.pathOr([], [modelName, 'data'])(models);
    const loading = R.pathOr(false, [modelName, 'loading'])(models);

    const { items: dataSource, pagination } = responseProxy.extract(response);

    logger.debug('[render]', { creatable, models, dataSource, columns, pagination });

    return (
      <>
        {creatable && (
          <React.Fragment>
            <Button onClick={() => (_.isFunction(creatable) ? creatable(extraName) : this._create())}>Create</Button>
            <Divider type="vertical" />
          </React.Fragment>
        )}
        <Button onClick={this._refresh}>Refresh</Button>

        <Divider type="vertical" />

        {/* TODO 导入导出按钮，目前接口已经实现，但是暂未集成 */}
        <Button.Group>
          <Button onClick={this._import} disabled={true}>
            Import
          </Button>
          <Button onClick={this._export} disabled={true}>
            Export
          </Button>
        </Button.Group>

        <Divider type="vertical" />

        {opts && opts.renderActions && (
          <>
            {opts.renderActions({ modelName, callRefresh: this._refresh })}
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

        <hr />

        {columns && (
          <Table
            size={'small'}
            className="asuna-content-table"
            scroll={{ x: true }}
            dataSource={dataSource}
            rowKey={this.state.primaryKey}
            loading={loading}
            columns={columns}
            pagination={pagination}
            onChange={this._handleTableChange}
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
  }
}

const mapStateToProps = (state: RootState): any => state.content;

export default connect(mapStateToProps)(ContentIndex);
