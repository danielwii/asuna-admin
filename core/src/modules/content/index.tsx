import React from 'react';
import { connect } from 'react-redux';
import * as R from 'ramda';
import _ from 'lodash';

import { Button, Divider, Modal, Table } from 'antd';
import { Subscription } from 'rxjs';

import { contentActions, modelsActions, panesActions, RootState } from '@asuna-admin/store';
import { castModelKey, diff } from '@asuna-admin/helpers';
import { responseProxy } from '@asuna-admin/adapters';
import { ActionEvent, AppContext, EventBus, EventType } from '@asuna-admin/core';
import { createLogger } from '@asuna-admin/logger';
import { PaginationConfig } from 'antd/es/pagination';
import { ColumnProps } from 'antd/es/table';
import { SorterResult } from 'antd/lib/table';

const logger = createLogger('modules:content:index');

interface IProps extends ReduxProps {
  basis: { pane: { key: string } };
  activeKey: string;
  models: object;
  nextGetConfig: any;
}

interface IState {
  key: string;
  modelName: string;
  relations?: string[];
  /**
   * 不为 true 时页面不显示新建按钮
   */
  creatable: boolean;
  columns?: (ColumnProps<any> & { relation: any })[];
  pagination?: PaginationConfig;
  filters?: Record<any, string[]>;
  sorter?: Partial<SorterResult<any>>;
  subscription: Subscription;
  busSubscription: Subscription;
  hasGraphAPI?: string;
}

class ContentIndex extends React.Component<IProps, IState> {
  private modelsAdapter = AppContext.adapters.models;

  constructor(props) {
    super(props);

    const { basis, activeKey } = this.props;

    logger.debug('[constructor]', { basis });

    // content::name => name
    // prettier-ignore
    const modelName = _.get(basis, 'pane.model') || _.get(basis, 'pane.key').match(/^\w+::(\w+).*$/)[1];
    const modelConfig = this.modelsAdapter.getModelConfig(modelName);
    logger.debug('[constructor]', { modelConfig, modelName });

    this.state = {
      modelName,
      creatable: modelConfig.creatable !== false,
      key: activeKey,
      sorter: {
        columnKey: 'id',
        field: 'id',
        order: 'descend',
      },
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
    const { creatable, modelName } = this.state;
    const actions = (text, record, extras) => (
      <span>
        {/*{extras && extras(auth)}*/}
        <Button size="small" type="dashed" onClick={() => this._edit(text, record)}>
          {creatable ? 'Edit' : 'View'}
        </Button>
        {R.not(R.prop(castModelKey('isSystem'), record)) && (
          <React.Fragment>
            <Divider type="vertical" />
            <Button size="small" type="danger" onClick={() => this._remove(text, record)}>
              Delete
            </Button>
          </React.Fragment>
        )}
      </span>
    );

    // prettier-ignore
    const columns = await this.modelsAdapter.getColumns(modelName, {
      callRefresh: this._refresh,
      actions,
    });
    // prettier-ignore
    const relations = R.compose(
      R.filter(R.compose(R.not, R.isEmpty)),
      R.map(R.values),
      R.map(R.pick(['relation'])),
    )(columns);

    const hasGraphAPI = _.find(
      await AppContext.ctx.graphql.loadGraphs(),
      schema => schema === `sys_${modelName}`,
    );

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
    Modal.confirm({
      title: '是否确认',
      content: `删除 ${modelName}？`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => dispatch(modelsActions.remove(modelName, record)),
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

  render() {
    const { modelName, columns, creatable } = this.state;

    const { models } = this.props;

    const response = R.pathOr([], [modelName, 'data'])(models);
    const loading = R.pathOr(false, [modelName, 'loading'])(models);

    const { items: dataSource, pagination } = responseProxy.extract(response);

    logger.debug('[render]', { creatable, models, dataSource, columns, pagination });

    return (
      <>
        {creatable && (
          <React.Fragment>
            <Button onClick={this._create}>Create</Button>
            <Divider type="vertical" />
          </React.Fragment>
        )}
        <Button onClick={this._refresh}>Refresh</Button>

        <hr />

        {columns && (
          <Table
            className="asuna-content-table"
            dataSource={dataSource}
            rowKey="id"
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
          .asuna-content-table td,
          th {
            padding: 0.3rem !important;
          }
        `}</style>
      </>
    );
  }
}

const mapStateToProps = (state: RootState): any => state.content;

export default connect(mapStateToProps)(ContentIndex);
