import React       from 'react';
import PropTypes   from 'prop-types';
import { connect } from 'react-redux';
import * as R      from 'ramda';

import { Button, Divider, Table } from 'antd';

import { panesActions }   from '../../store/panes.redux';
import { contentActions } from '../../store/content.redux';
import { modelsProxy }    from '../../adapters/models';
import { responseProxy }  from '../../adapters/response';

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

    const actions = (text, record) => (
      <span>
        <Button size="small" type="dashed" onClick={() => this.edit(text, record)}>Edit</Button>
        <Divider type="vertical" />
      </span>
    );

    // content::colleges => colleges
    const model   = R.compose(R.nth(1), R.split(/::/), R.path(['pane', 'key']))(context);
    const configs = modelsProxy.modelConfigs(model);
    const columns = R.prop('table')(configs)(actions);

    this.state = { current: model, columns };

    console.log('current model is', model);
    dispatch(contentActions.loadModels(model));
  }

  create = () => {
    const { dispatch } = this.props;
    dispatch(panesActions.open({
      key   : `content::create::colleges::${Date.now()}`,
      title : '新增院校',
      linkTo: 'content::create',
    }));
  };

  edit = (text, record) => {
    console.log('edit', record);
  };

  render() {
    const { current, columns } = this.state;
    const { context, models }  = this.props;

    // const dataSource = _.get(models, `${current}.data`, []);
    const response = R.pathOr([], [current, 'data'])(models);

    const { items: dataSource, pagination } = responseProxy.extract(response);

    console.log('dataSource is', dataSource);
    console.log('columns is', columns);
    console.log('pagination is', pagination);

    return (
      <div>
        <h1>hello kitty!</h1>
        <hr />

        <Button onClick={this.create}>Create</Button>
        <Divider type="vertical" />
        <Button>Refresh</Button>

        <hr />

        <Table dataSource={dataSource} rowKey="id" columns={columns} pagination={pagination} />

        {/* <pre>{JSON.stringify(dataSource, null, 2)}</pre> */}
        <pre>{JSON.stringify(context, null, 2)}</pre>
      </div>
    );
  }
}

const mapStateToProps = state => ({ ...state.content });

export default connect(mapStateToProps)(ContentIndex);
