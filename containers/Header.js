import { connect } from 'react-redux';
import * as R      from 'ramda';

import Header         from '../components/Header';
import { appActions } from '../store/app.redux';

const mapStateToProps    = R.pick(['auth']);
const mapDispatchToProps = dispatch => ({
  dispatch,
  onSync: () => dispatch(appActions.sync()),
});

export default connect(mapStateToProps, mapDispatchToProps)(Header);
