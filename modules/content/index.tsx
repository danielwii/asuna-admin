import React from 'react';
import { connect } from 'react-redux';
import * as R from 'ramda';
import _ from 'lodash';

import { Button, Divider, Modal, Table } from 'antd';

import { RootState } from '../../store';
import { panesActions } from '../../store/panes.actions';
import { contentActions } from '../../store/content.redux';
import { modelsActions } from '../../store/model.redux';
import { modelProxy } from '../../adapters/model';

import { responseProxy, TablePagination } from '../../adapters/response';

import { castModelKey, diff } from '../../helpers';
import { createLogger, lv } from '../../helpers/logger';

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
}

class ContentIndex extends React.Component<IProps, IState> {
  constructor(props) {
    super(props);

    const { basis, auth, activeKey } = this.props;

    logger.debug('[constructor]', 'basis is', basis);

    const actions = (text, record, extras) => (
      <span>
        {extras && extras(auth)}
        <Button size="small" type="dashed" onClick={() => this.edit(text, record)}>
          Edit
        </Button>
        {R.not(R.prop(castModelKey('isSystem'), record)) && (
          <React.Fragment>
            <Divider type="vertical" />
            <Button size="small" type="danger" onClick={() => this.remove(text, record)}>
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
      callRefresh: this.refresh,
    });

    const relations = R.compose(
      R.filter(
        R.compose(
          R.not,
          R.isEmpty,
        ),
      ),
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
    };

    logger.log('[constructor]', 'current modelName is', modelName);
    const { pagination, filters, sorter } = this.state;
    this.handleTableChange(pagination, filters, sorter);
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

  create = () => {
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

  edit = (text, record) => {
    logger.log('[edit]', record);
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

  remove = (text, record) => {
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

  handleTableChange = (pagination, filters, sorter) => {
    logger.debug('[handleTableChange]', { pagination, filters, sorter });
    const { modelName, relations } = this.state;
    const { dispatch } = this.props;
    const transformedSorter = !_.isEmpty(sorter)
      ? ({ [sorter.field]: sorter.order.slice(0, -3) } as Sorter)
      : null;
    dispatch(
      contentActions.loadModels(modelName, { relations, pagination, sorter: transformedSorter }),
    );
    this.setState({ pagination, filters, sorter });
  };

  refresh = () => {
    const { pagination, filters, sorter } = this.state;
    this.handleTableChange(pagination, filters, sorter);
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
            <Button onClick={this.create}>Create</Button>
            <Divider type="vertical" />
          </React.Fragment>
        )}
        <Button onClick={this.refresh}>Refresh</Button>

        <hr />

        <Table
          className="asuna-content-table"
          dataSource={dataSource}
          rowKey="id"
          loading={loading}
          columns={columns}
          pagination={pagination as any}
          onChange={this.handleTableChange}
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
