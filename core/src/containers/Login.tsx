import { ILoginProps, Login } from '@asuna-admin/components';
import { authActions } from '@asuna-admin/store';
import * as React from 'react';
import { useDispatch } from 'react-redux';

/*
const mapStateToProps = (state: RootState) => ({});
const mapDispatchToProps = dispatch => ({
  dispatch,
  login: (username: string, password: string, callback) => dispatch(authActions.login(username, password, callback)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Login);*/

export const LoginContainer: React.FC = props => {
  const dispatch = useDispatch();
  const actions: {
    [action in keyof Pick<ILoginProps, 'login'>]: any;
  } = {
    login: (username: string, password: string, callback) => dispatch(authActions.login(username, password, callback)),
  };

  return <Login {...props} {...actions} />;
};
