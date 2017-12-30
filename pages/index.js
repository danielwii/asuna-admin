import React       from 'react';
import { connect } from 'react-redux';

import { MainLayout }    from '../layout';
import { withReduxSaga } from '../store';
import { menuActions }   from '../store/menu.redux';

class Index extends React.Component {
  componentWillMount() {
    console.log('componentWillMount...');
    const { dispatch } = this.props;
    dispatch(menuActions.init());
  }

  render() {
    return (
      <MainLayout />
    );
  }
}

export default withReduxSaga(connect()(Index));
