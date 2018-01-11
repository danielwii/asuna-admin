import React       from 'react';
import PropTypes   from 'prop-types';
import { connect } from 'react-redux';
import _           from 'lodash';
import * as R      from 'ramda';

import { Table } from 'antd';

import { contentActions } from '../../store/content.redux';
import { modelsProxy }    from '../../adapters/models';

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

    // content::colleges => colleges
    const model = R.compose(R.nth(1), R.split(/::/), R.path(['pane', 'key']))(context);
    this.state  = { current: model };

    console.log('current model is', model);
    dispatch(contentActions.loadModels(model));
  }

  componentWillMount() {
    console.log('props is', this.props);
  }

  render() {
    const { current } = this.state;
    const { models }  = this.props;

    // const dataSource = _.get(models, `${current}.data`, []);
    const dataSource = R.pathOr([], [current, 'data'])(models);
    const config     = modelsProxy.modelConfig(current);
    const columns    = R.prop('columns')(config);

    console.log('dataSource is', dataSource);
    console.log('columns is', columns);

    return (
      <div>
        <h1>hello kitty!</h1>
        <hr />

        <Table dataSource={dataSource} rowKey="id" columns={columns} />

        {/* <pre>{JSON.stringify(dataSource, null, 2)}</pre> */}
      </div>
    );
  }
}

const mapStateToProps = state => ({ ...state.content });

export default connect(mapStateToProps)(ContentIndex);
