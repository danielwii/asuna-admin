import { connect } from 'react-redux';

import { Header } from '@asuna-admin/components';
import { RootState, appActions, authActions } from '@asuna-admin/store';

const mapStateToProps = (state: RootState) => ({
  auth: state.auth,
  app: state.app,
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
