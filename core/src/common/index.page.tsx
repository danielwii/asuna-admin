import { AppContext, IIndexRegister, ILoginRegister, INextConfig } from '@asuna-admin/core';
import { MainLayout } from '@asuna-admin/layout';
import { createLogger } from '@asuna-admin/logger';
import { appActions, AppState, AuthState, RootState } from '@asuna-admin/store';

import 'moment/locale/zh-cn';
import * as R from 'ramda';
import * as React from 'react';
import { connect } from 'react-redux';

const logger = createLogger('pages:index');

// --------------------------------------------------------------
// Index Component
// --------------------------------------------------------------

export interface IIndexPageProps extends ReduxProps {
  auth: AuthState;
  app: AppState;
  register: ILoginRegister & IIndexRegister;
  hideCharacteristics?: boolean;
  appInfo: { userAgent: string; environments: object };
}

export class IndexPage extends React.Component<IIndexPageProps> {
  constructor(props) {
    super(props);

    const { dispatch, register } = this.props;
    AppContext.setup({ register, module: 'index' });
    AppContext.regDispatch(dispatch);
    dispatch(appActions.init());
  }

  static async getInitialProps({ req }) {
    const userAgent = req ? req.headers['user-agent'] : navigator.userAgent;
    const appInfo = {
      userAgent,
      environments: { production: process.env.NODE_ENV === 'production' },
    };

    return { appInfo };
  }

  render() {
    const {
      auth,
      app: { loading, heartbeat },
      appInfo,
      hideCharacteristics,
    } = this.props;
    logger.debug('[render]', this.props);

    return (
      <MainLayout
        loading={loading}
        heartbeat={heartbeat}
        auth={auth}
        appInfo={appInfo}
        hideCharacteristics={hideCharacteristics}
      />
    );
  }
}

const mapStateToProps = (state: RootState) => ({
  auth: state.auth,
  app: state.app,
});

// prettier-ignore
export const renderIndexPage = (props: Partial<IIndexPageProps>, nextConfig: INextConfig) => {
  AppContext.init(nextConfig);
  return connect(R.compose(R.merge(props), mapStateToProps))(IndexPage);
};
