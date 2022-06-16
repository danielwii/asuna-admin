import consola from 'consola';
import * as React from 'react';

import { Func } from '../adapters/func';
import { Header, IHeaderProps } from '../components/Header';
import { useSharedPanesFunc, useSharedPanesGlobalValue } from '../store/panes.global';
import { withDebugSettingsProps } from './DebugSettings';

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
    },
    logout: () => Func.logout(),
    withDebugSettingsProps,
    handleAction: (action, componentName) => {
      sharedPanesFunc.open({ key: `${action}`, title: action, linkTo: 'content::blank', component: componentName });
    },
  };

  return <Header {...props} {...actions} />;
};
