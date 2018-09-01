import getConfig from 'next/config';
import { connect } from 'react-redux';
import * as R from 'ramda';

import Header from '@asuna-admin/components/Header';

import { RootState, appActions, authActions } from '@asuna-admin/store';

const { publicRuntimeConfig = {} } = getConfig() || {};

const mapStateToProps = (state: RootState) => ({
  auth: state.auth,
  app: state.app,
  env: publicRuntimeConfig.env || 'dev',
});
const mapDispatchToProps = dispatch => ({
  dispatch,
  onSync: () => dispatch(appActions.heartbeat(true)),
  logout: () => dispatch(authActions.logout()),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Header);
