import { message } from 'antd';
import _ from 'lodash';
import React from 'react';
import { useLocalStorage } from 'react-use';
import useAsync from 'react-use/lib/useAsync';
import { FoldingCube } from 'styled-spinkit';

import { authProxy, securityProxy } from '../adapters/proxy';
import { ILoginProps, NormalLoginForm } from '../components/Login';
import { AppNavigator } from '../context/navigator';
import { toErrorMessage } from '../helpers/error';
import { createLogger } from '../logger';

const logger = createLogger('containers:login');

export const LoginContainer: React.VFC<any> = (props) => {
  const [token, setToken, removeToken] = useLocalStorage<string>('token', undefined, { raw: true });

  const state = useAsync(async () => {
    if (!_.isEmpty(token)) {
      const currentUser = await securityProxy.currentUser();
      if (currentUser) {
        logger.log('current user is', currentUser);
        AppNavigator.toIndex();
      } else {
        logger.error('login error', currentUser);
        message.error('登录失败');
      }
    }
  }, [token]);

  if (state.loading) return <FoldingCube />;

  const actions: {
    [action in keyof Pick<ILoginProps, 'login'>]: any;
  } = {
    login: async (username: string, password: string) => {
      message.info('login...');
      try {
        logger.log('[login-action]', { username, password });
        const res = await authProxy.login(username, password);
        logger.log('[login-action]', res, res.data.accessToken);
        setToken(res.data.accessToken);
      } catch (error) {
        logger.error('[login-action]', error);
        message.error(error.response ? toErrorMessage(error) : error.message);
      }
    },
  };

  return <NormalLoginForm {...props} {...actions} />;
};
