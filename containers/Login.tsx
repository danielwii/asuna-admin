import { connect } from 'react-redux';

import { authActions }  from '../store/auth.actions';
import Login            from '../components/Login';
import { RootState }    from '../store';
import { authProxy }    from 'adapters/auth';
import { Dispatch }     from 'redux';
import { panesActions } from 'store/panes.actions';

const mapStateToProps    = (state: RootState) => ({});
const mapDispatchToProps = dispatch => ({
  dispatch,
  login: (username: string, password: string) => dispatch(authActions.login(username, password)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Login as any);
