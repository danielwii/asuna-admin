import consola from 'consola';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Header, IHeaderProps } from '../components/Header';
import { AppNavigator } from '../context/navigator';
import { AppContext } from '../core/context';
import { useSharedPanesFunc, useSharedPanesGlobalValue } from '../store/panes.global';
import { withDebugSettingsProps } from './DebugSettings';

import type { RootState } from '../store/types';

export const HeaderRender: React.VFC<Pick<IHeaderProps, 'hideLogo'>> = (props) => {
  const [, panesStateSetter] = useSharedPanesGlobalValue();
  const sharedPanesFunc = useSharedPanesFunc(panesStateSetter);

  /*
  const states = useSelector<RootState, Pick<IHeaderProps, 'auth' | 'app' | 'env' | 'version'>>((state) => ({
    auth: state.auth,
    app: state.app,
    env: AppContext.publicConfig.env,
    version: AppContext.publicConfig.version,
  }));*/
  // const dispatch = useDispatch();
  const actions: {
    [action in keyof Pick<IHeaderProps, 'onSync' | 'logout' | 'withDebugSettingsProps' | 'handleAction'>]: any;
  } = {
    onSync: () => {
      consola.error('onSync...');
      // return dispatch(appActions.heartbeat(true));
    },
    logout: () => {
      localStorage.removeItem('token');
      return AppNavigator.isLogin();
      // return dispatch(authActions.logout());
    },
    withDebugSettingsProps,
    handleAction: (action, componentName) => {
      sharedPanesFunc.open({ key: `${action}`, title: action, linkTo: 'content::blank', component: componentName });
    },
  };

  return <Header {...props} {...actions} />;
};
