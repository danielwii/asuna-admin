import React       from 'react';
import { connect } from 'react-redux';
import dynamic     from 'next/dynamic';

import { withReduxSaga } from '../store';
import { menuActions }   from '../store/menu.redux';

import auth from '../services/auth';

// --------------------------------------------------------------
// Setup context
// --------------------------------------------------------------

const context = {
  auth,
};

// --------------------------------------------------------------
// Define main app dynamic loader
// --------------------------------------------------------------

const DynamicMainLayoutLoading = dynamic(
  import('../layout/main'),
  {
    loading: () => <p>loading...</p>,
  },
);

// --------------------------------------------------------------
// Index Component
// --------------------------------------------------------------

class Index extends React.Component {
  componentWillMount() {
    console.log('componentWillMount...');
    const { dispatch } = this.props;
    dispatch(menuActions.init());
  }

  render() {
    return (
      <DynamicMainLayoutLoading />
    );
  }
}

export default withReduxSaga(connect()(Index));
