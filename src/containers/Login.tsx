import { ILoginProps, NormalLoginForm } from '@asuna-admin/components';
import { authActions } from '@asuna-admin/store';
import * as React from 'react';
import { useDispatch } from 'react-redux';

export const LoginContainer: React.FC = (props) => {
  const dispatch = useDispatch();
  const actions: {
    [action in keyof Pick<ILoginProps, 'login'>]: any;
  } = {
    login: (username: string, password: string, callback) => dispatch(authActions.login(username, password, callback)),
  };

  return <NormalLoginForm {...props} {...actions} />;
};
