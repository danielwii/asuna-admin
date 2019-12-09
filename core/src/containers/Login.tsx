import { Login } from '@asuna-admin/components';
import { authActions, RootState } from '@asuna-admin/store';

import * as React from 'react';
import { connect } from 'react-redux';

const mapStateToProps = (state: RootState) => ({});
const mapDispatchToProps = dispatch => ({
  dispatch,
  login: (username: string, password: string, callback) => dispatch(authActions.login(username, password, callback)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Login);
