import * as React from 'react';

import { Func } from '../adapters/func';
import { Header, IHeaderProps } from '../components/Header';
import { createLogger } from '../logger';
import { useSharedPanesFunc, useSharedPanesGlobalValue } from '../store/panes.global';

const logger = createLogger('containers:header');

export const HeaderContainer: React.FC<Pick<IHeaderProps, 'hideLogo'>> = ({ hideLogo }) => {
  const [, panesStateSetter] = useSharedPanesGlobalValue();
  const sharedPanesFunc = useSharedPanesFunc(panesStateSetter);

  return (
    <Header
      hideLogo={hideLogo}
      onSync={() => {
        logger.error('TODO onSync not implemented...');
      }}
      logout={Func.logout}
      handleAction={(action, componentName) =>
        sharedPanesFunc.open({
          key: `${action}`,
          title: action,
          linkTo: 'content::blank',
          component: componentName,
        })
      }
    />
  );
};
