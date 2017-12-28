import React from 'react';

import { connect } from 'react-redux';

import { withReduxSaga } from '../store';
import { AntdLayout }    from '../layout';

const Home = props => (
  <AntdLayout>
    <div>home</div>
  </AntdLayout>
);

const mapStateToProps = state => ({
  global       : state.global,
  notifications: state.notifications,
});

export default withReduxSaga(connect(mapStateToProps)(Home));
