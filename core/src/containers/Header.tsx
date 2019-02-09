import React from 'react';
import { connect } from 'react-redux';

import { Header } from '@asuna-admin/components';
import { appActions, authActions, RootState } from '@asuna-admin/store';
import { AppContext } from 'asuna-admin';

const mapStateToProps = (state: RootState) => ({
  auth: state.auth,
  app: state.app,
  env: AppContext.publicConfig.env,
  version: AppContext.publicConfig.version,
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
