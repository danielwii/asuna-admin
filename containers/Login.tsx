import { connect } from 'react-redux';

import { authActions } from '../store/auth.actions';
import Login           from '../components/Login';
import { RootState }   from '../store';

const mapStateToProps    = (state: RootState) => ({});
const mapDispatchToProps = dispatch => ({
  dispatch,
  login: (username: string, password: string, callback) =>
    dispatch(authActions.login(username, password, callback)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Login as any);
