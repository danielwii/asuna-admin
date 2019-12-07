import { Header, IHeaderProps } from '@asuna-admin/components';
import { AppContext } from '@asuna-admin/core';
import { appActions, authActions, panesActions, RootState } from '@asuna-admin/store';

import React from 'react';
import { connect } from 'react-redux';

import { withDebugSettingsProps } from './DebugSettings';

const mapStateToProps = (state: RootState): Partial<IHeaderProps> => ({
  auth: state.auth,
  app: state.app,
  env: AppContext.publicConfig.env,
  version: AppContext.publicConfig.version,
});
const mapDispatchToProps = (dispatch): Partial<IHeaderProps> => ({
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
});

export default connect(mapStateToProps, mapDispatchToProps)(Header);
