import React       from 'react';
import PropTypes   from 'prop-types';
import { connect } from 'react-redux';
import * as R      from 'ramda';

import { Button, Divider, Table } from 'antd';

import { panesActions }   from '../../store/panes.redux';
import { contentActions } from '../../store/content.redux';
import { modelsProxy }    from '../../adapters/models';
import { responseProxy }  from '../../adapters/response';
import { createLogger }   from '../../adapters/logger';

const logger = createLogger('modules:content:index');

class ContentIndex extends React.Component {
  static propTypes = {
    context: PropTypes.shape({
      pane: PropTypes.shape({
        key: PropTypes.string,
      }),
    }),
    models : PropTypes.shape({}),
  };

  constructor(props) {
    super(props);

    const { dispatch, context } = this.props;

    logger.info('context is', context);

    const actions = (text, record) => (
      <span>
        <Button size="small" type="dashed" onClick={() => this.edit(text, record)}>Edit</Button>
        <Divider type="vertical" />
      </span>
    );

    // content::name => name
    const modelName = R.compose(R.nth(1), R.split(/::/), R.path(['pane', 'key']))(context);
    const configs   = modelsProxy.getModelConfigs(modelName);
    logger.info('load table from configs', configs, 'by', modelName);

    const columns = R.prop('table')(configs)(actions);

    this.state = { modelName, columns };

    logger.log('current modelName is', modelName);
    dispatch(contentActions.loadModels(modelName));
  }

  shouldComponentUpdate(nextProps, nextState, nextContext: any): boolean {
    logger.info('[shouldComponentUpdate]', nextProps, nextState, nextContext);
    const { key }       = this.state;
    const { activeKey } = nextProps;
    logger.info('[shouldComponentUpdate]', key, activeKey);
    return !key || key === activeKey;
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
    logger.log('edit', record);
    const { modelName } = this.state;
    const { dispatch }  = this.props;
    dispatch(panesActions.open({
      key   : `content::upsert::${modelName}::${record.id}`,
      title : `更新 - ${modelName} - ${record.name || ''}`,
      linkTo: 'content::upsert',
      data  : { modelName, record },
    }));
  };

  handleTableChange = (pagination, filters, sorter) => {
    logger.info(pagination, filters, sorter);
    const { modelName } = this.state;
    const { dispatch }  = this.props;
    dispatch(contentActions.loadModels(modelName, { pagination, filters, sorter }));
    this.setState({ pagination, filters, sorter });
  };

  refresh = () => {
    const { pagination, filters, sorter } = this.state;
    this.handleTableChange(pagination, filters, sorter);
  };

  render() {
    const { modelName, columns } = this.state;
    const { context, models }    = this.props;

    const response = R.pathOr([], [modelName, 'data'])(models);

    const { items: dataSource, pagination } = responseProxy.extract(response);

    logger.info('models is', models);
    logger.info('dataSource is', dataSource);
    logger.info('columns is', columns);
    logger.info('pagination is', pagination);

    return (
      <div>
        <hr />

        <Button onClick={this.create}>Create</Button>
        <Divider type="vertical" />
        <Button onClick={this.refresh}>Refresh</Button>

        <hr />

        <Table
          dataSource={dataSource}
          rowKey="id"
          columns={columns}
          pagination={pagination}
          onChange={this.handleTableChange}
        />

        {/* <pre>{JSON.stringify(dataSource, null, 2)}</pre> */}
        <pre>{JSON.stringify(context, null, 2)}</pre>
      </div>
    );
  }
}

const mapStateToProps = state => ({ ...state.content });

export default connect(mapStateToProps)(ContentIndex);
