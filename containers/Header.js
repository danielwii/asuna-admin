import { connect } from 'react-redux';
import * as R      from 'ramda';

import Header         from '../components/Header';
// eslint-disable-next-line import/extensions
import { appActions } from '../store/app.actions';

const mapStateToProps    = R.pick(['auth', 'app']);
const mapDispatchToProps = dispatch => ({
  dispatch,
  onSync: () => dispatch(appActions.heartbeat(true)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Header);
