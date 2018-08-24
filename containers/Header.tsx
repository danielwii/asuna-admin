import getConfig from 'next/config';
import { connect } from 'react-redux';
import * as R from 'ramda';

import Header from '../components/Header';

import { RootState, appActions, authActions } from '@asuna-admin/store';

const { publicRuntimeConfig = {} } = getConfig() || {};

const mapStateToProps = (state: RootState) => ({
  ...R.pick(['auth', 'app'])(state),
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
)(Header as any);
