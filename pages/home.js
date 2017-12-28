import React from 'react';

import { connect } from 'react-redux';

import { withReduxSaga } from '../store';
import Layout            from '../layout';

const Home = props => <Layout><div>home</div></Layout>;

const mapStateToProps = state => ({
  global       : state.global,
  notifications: state.notifications,
});

export default withReduxSaga(connect(mapStateToProps)(Home));
