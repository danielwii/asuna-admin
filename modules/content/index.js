import React       from 'react';
import PropTypes   from 'prop-types';
import { connect } from 'react-redux';
import * as R      from 'ramda';
import _           from 'lodash';

import { Button, Divider, Modal, Table } from 'antd';

import { panesActions }   from '../../store/panes.redux';
// eslint-disable-next-line import/extensions
import { contentActions } from '../../store/content.redux';
import { modelsActions }  from '../../store/model.redux';
import { modelProxy }     from '../../adapters/model';
import { responseProxy }  from '../../adapters/response';

import { createLogger, lv }   from '../../helpers/logger';
import { castModelKey, diff } from '../../helpers';

const logger = createLogger('modules:content:index', lv.warn);

class ContentIndex extends React.Component {
  static propTypes = {
    basis    : PropTypes.shape({
      pane: PropTypes.shape({
        key: PropTypes.string,
      }),
    }),
    activeKey: PropTypes.string,
    models   : PropTypes.shape({}),
    auth     : PropTypes.shape({}),
  };

  constructor(props) {
    super(props);

    const { dispatch, basis, auth, activeKey } = this.props;

    logger.info('[constructor]', 'basis is', basis);

    const actions = (text, record, extras) => (
      <span>
        {extras && extras(auth)}
        <Button size="small" type="dashed" onClick={() => this.edit(text, record)}>Edit</Button>
        {R.not(R.prop(castModelKey('isSystem'), record)) && (
          <React.Fragment>
            <Divider type="vertical" />
            <Button
              size="small"
              type="danger"
              onClick={() => this.remove(text, record)}
            >Delete</Button>
          </React.Fragment>
        )}
      </span>
    );

    // content::name => name
    const modelName = R.compose(R.nth(1), R.split(/::/), R.path(['pane', 'key']))(basis);
    const configs   = modelProxy.getModelConfig(modelName);
    logger.info('[constructor]', 'load table from configs', configs, 'by', modelName);

    const columns = R.prop('table', configs)(actions, {
      auth,
      modelName,
      callRefresh: this.refresh,
    });

    this.state = { modelName, columns, key: activeKey };

    logger.log('[constructor]', 'current modelName is', modelName);
    dispatch(contentActions.loadModels(modelName));
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    logger.info('[shouldComponentUpdate]', { nextProps, nextState, nextContext });
    const { key }       = this.state;
    const { activeKey } = nextProps;
    const samePane      = key === activeKey;
    const propsDiff     = diff(this.props, nextProps);
    const shouldUpdate  = samePane && propsDiff.isDifferent;
    logger.info('[shouldComponentUpdate]', { key, activeKey, samePane, shouldUpdate, propsDiff });
    return shouldUpdate;
  }

  create = () => {
    const { modelName } = this.state;
    const { dispatch }  = this.props;
    dispatch(panesActions.open({
      key   : `content::upsert::${modelName}::${Date.now()}`,
      title : `新增 - ${modelName}`,
      linkTo: 'content::upsert',
    }));
  };

  edit = (text, record) => {
    logger.log('[edit]', record);
    const { modelName } = this.state;
    const { dispatch }  = this.props;
    dispatch(panesActions.open({
      key   : `content::upsert::${modelName}::${record.id}`,
      title : `更新 - ${modelName} - ${record.name || ''}`,
      linkTo: 'content::upsert',
      data  : { modelName, record },
    }));
  };

  remove = (text, record) => {
    logger.log('[remove]', record);
    const { modelName } = this.state;
    const { dispatch }  = this.props;
    Modal.confirm({
      title     : '是否确认',
      content   : `删除 ${modelName}？`,
      okText    : '确认',
      cancelText: '取消',
      onOk      : () => {
        dispatch(modelsActions.remove(modelName, record));
      },
    });
  };

  handleTableChange = (pagination, filters, sorter) => {
    logger.info('[handleTableChange]', { pagination, filters, sorter });
    const { modelName }     = this.state;
    const { dispatch }      = this.props;
    const transformedSorter = !_.isEmpty(sorter)
      ? { [sorter.field]: sorter.order.slice(0, -3) }
      : null;
    dispatch(contentActions.loadModels(modelName, { pagination, sorter: transformedSorter }));
    this.setState({ pagination, filters, sorter });
  };

  refresh = () => {
    const { pagination, filters, sorter } = this.state;
    this.handleTableChange(pagination, filters, sorter);
  };

  render() {
    const { modelName, columns } = this.state;
    const { models }             = this.props;

    const response = R.pathOr([], [modelName, 'data'])(models);
    const loading  = R.pathOr(false, [modelName, 'loading'])(models);

    const { items: dataSource, pagination } = responseProxy.extract(response);

    logger.info('[render]', { models, dataSource, columns, pagination });

    return (
      <div>
        <hr />

        <Button onClick={this.create}>Create</Button>
        <Divider type="vertical" />
        <Button onClick={this.refresh}>Refresh</Button>

        <hr />

        <Table
          className="asuna-content-table"
          dataSource={dataSource}
          rowKey="id"
          loading={loading}
          columns={columns}
          pagination={pagination}
          onChange={this.handleTableChange}
        />
        {/* language=CSS */}
        <style jsx global>{`
          .asuna-content-table td, th {
            padding: 0.3rem !important;
          }
        `}</style>
      </div>
    );
  }
}

const mapStateToProps = state => ({ ...state.content, auth: state.auth });

export default connect(mapStateToProps)(ContentIndex);
