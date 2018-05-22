import getConfig   from 'next/config';
import { connect } from 'react-redux';
import * as R      from 'ramda';

import Header         from '../components/Header';
import { appActions } from '../store/app.actions';
import { RootState }  from '../store';

const { publicRuntimeConfig = {} } = getConfig() || {};

const mapStateToProps    = (state: RootState) => ({
  ...R.pick(['auth', 'app'])(state),
  env: publicRuntimeConfig.env || 'dev'
});
const mapDispatchToProps = dispatch => ({
  dispatch,
  onSync: () => dispatch(appActions.heartbeat(true)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Header);
