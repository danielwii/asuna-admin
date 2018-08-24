import React from 'react';
import { connect } from 'react-redux';
import * as R from 'ramda';
import _ from 'lodash';

import { Button, Divider, Modal, Table } from 'antd';
import { Subscription } from 'rxjs';

import { ActionEvent, bus, EventType } from '../../core/events';

import { appContext } from '../../core/context';

import { contentActions, modelsActions, panesActions, RootState } from '@asuna-admin/store';
import { castModelKey, createLogger, diff } from '@asuna-admin/helpers';
import { modelProxy, responseProxy, TablePagination } from '@asuna-admin/adapters';

const logger = createLogger('modules:content:index', 'warn');

interface IProps extends ReduxProps {
  basis: {
    pane: {
      key: string;
    };
  };
  activeKey: string;
  models: object;
  auth: object;
}

interface IState {
  key: string;
  modelName: string;
  relations: string[];
  /**
   * 不为 true 时页面不显示新建按钮
   */
  creatable: boolean;
  columns: any;
  pagination?: TablePagination;
  filters?: object;
  sorter?: object;
  // sorter?: {
  //   [key: string]: 'asc' | 'desc';
  // };
  subscription: Subscription;
  busSubscription: Subscription;
}

class ContentIndex extends React.Component<IProps, IState> {
  constructor(props) {
    super(props);

    const { basis, auth, activeKey } = this.props;

    logger.debug('[constructor]', { basis });

    const actions = (text, record, extras) => (
      <span>
        {extras && extras(auth)}
        <Button size="small" type="dashed" onClick={() => this._edit(text, record)}>
          Edit
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

    // content::name => name
    // prettier-ignore
    const modelName = R.compose(R.nth(1), R.split(/::/), R.path(['pane', 'key']))(basis);
    const configs = modelProxy.getModelConfig(modelName);
    logger.debug('[constructor]', { configs, modelName });

    const columns = R.prop('table', configs)(actions, {
      auth,
      modelName,
      callRefresh: this._refresh,
    });

    // prettier-ignore
    const relations = R.compose(
      R.filter(R.compose(R.not, R.isEmpty)),
      R.map(R.values),
      R.map(R.pick(['relation'])),
    )(columns);

    this.state = {
      modelName,
      columns,
      relations,
      creatable: configs.creatable !== false,
      key: activeKey,
      sorter: {
        columnKey: 'id',
        field: 'id',
        order: 'descend',
      },
      subscription: appContext.subject.subscribe({
        next: action => {
          // logger.log('[observer-content-index]', { modelName, activeKey, action });
        },
      }),
      busSubscription: bus.subscribe({
        next: (action: ActionEvent) => {
          if (
            [EventType.MODEL_INSERT, EventType.MODEL_UPDATE].includes(action.type) &&
            action.payload.modelName === modelName
          ) {
            logger.log('[bus-content-index]', { modelName, activeKey, action });
            this._refresh();
          }
        },
      }),
    };

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
        title: `新增 - ${modelName}`,
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
        title: `更新 - ${modelName} - ${record.name || ''}`,
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
      onOk: () => {
        dispatch(modelsActions.remove(modelName, record));
      },
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
    dispatch(
      contentActions.loadModels(modelName, { relations, pagination, sorter: transformedSorter }),
    );
    this.setState({ pagination, filters, sorter });
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
      <div>
        {creatable && (
          <React.Fragment>
            <Button onClick={this._create}>Create</Button>
            <Divider type="vertical" />
          </React.Fragment>
        )}
        <Button onClick={this._refresh}>Refresh</Button>

        <hr />

        <Table
          className="asuna-content-table"
          dataSource={dataSource}
          rowKey="id"
          loading={loading}
          columns={columns}
          pagination={pagination as any}
          onChange={this._handleTableChange}
        />
        {/* language=CSS */}
        <style jsx global>{`
          .asuna-content-table td,
          th {
            padding: 0.3rem !important;
          }
        `}</style>
      </div>
    );
  }
}

const mapStateToProps = (state: RootState) => ({ ...state.content, auth: state.auth });

export default connect(mapStateToProps)(ContentIndex);
