import { connect } from 'react-redux';

import Login from '@asuna-admin/components/Login';

import { RootState, authActions } from '@asuna-admin/store';

const mapStateToProps = (state: RootState) => ({});
const mapDispatchToProps = dispatch => ({
  dispatch,
  login: (username: string, password: string, callback) =>
    dispatch(authActions.login(username, password, callback)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Login);
