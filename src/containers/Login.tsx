import React from 'react';
import { connect } from 'react-redux';

import { Login, ILoginProps } from '@asuna-admin/components';
import { RootState, authActions } from '@asuna-admin/store';

const mapStateToProps = (state: RootState) => ({});
const mapDispatchToProps = dispatch => ({
  dispatch,
  login: (username: string, password: string, callback) =>
    dispatch(authActions.login(username, password, callback)),
});

export { ILoginProps };

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Login);
