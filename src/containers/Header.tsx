import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Header, IHeaderProps } from '../components';
import { AppContext } from '../core';
import { appActions, authActions, panesActions, RootState } from '../store';
import { withDebugSettingsProps } from './DebugSettings';

export const HeaderRender: React.FC<Pick<IHeaderProps, 'hideLogo'>> = (props) => {
  const states = useSelector<RootState, Pick<IHeaderProps, 'auth' | 'app' | 'env' | 'version'>>((state) => ({
    auth: state.auth,
    app: state.app,
    env: AppContext.publicConfig.env,
    version: AppContext.publicConfig.version,
  }));
  const dispatch = useDispatch();
  const actions: {
    [action in keyof Pick<IHeaderProps, 'onSync' | 'logout' | 'withDebugSettingsProps' | 'handleAction'>]: any;
  } = {
    onSync: () => dispatch(appActions.heartbeat(true)),
    logout: () => dispatch(authActions.logout()),
    withDebugSettingsProps,
    handleAction: (action, componentName) => {
      // console.log('container-header [handleAction]', { action, componentName });
      AppContext.dispatch(
        panesActions.open({
          key: `${action}`,
          title: action,
          linkTo: 'content::blank',
          component: componentName,
        }),
      );
    },
  };

  return <Header {...props} {...states} {...actions} />;
};
