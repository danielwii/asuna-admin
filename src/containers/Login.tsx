import { message } from 'antd';
import _ from 'lodash';
import React, { useEffect } from 'react';
import { useLocalStorage } from 'react-use';

import { authProxy, securityProxy } from '../adapters/proxy';
import { ILoginProps, NormalLoginForm } from '../components/Login';
import { AppNavigator } from '../context/navigator';
import { toErrorMessage } from '../helpers/error';
import { createLogger } from '../logger';

const logger = createLogger('containers:login');

export const LoginContainer: React.VFC<any> = (props) => {
  const [token, setToken, removeToken] = useLocalStorage<string>('token', undefined, { raw: true });

  useEffect(() => {
    if (!_.isEmpty(token)) {
      (async () => {
        const currentUser = await securityProxy.currentUser();
        logger.log('current user is', currentUser);
        AppNavigator.toIndex();
      })().catch((reason) => logger.error('[current-action]', reason));
    }
  }, [token]);

  const actions: {
    [action in keyof Pick<ILoginProps, 'login'>]: any;
  } = {
    login: async (username: string, password: string) => {
      try {
        logger.log('[login-action]', { username, password });
        const res = await authProxy.login(username, password);
        logger.log('[login-action]', res, res.data.accessToken);
        setToken(res.data.accessToken);
      } catch (error) {
        logger.error('[login-action]', { error });
        if (error.response) {
          message.error(toErrorMessage(error));
        }
      }
    },
  };

  return <NormalLoginForm {...props} {...actions} />;
};
