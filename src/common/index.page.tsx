import React from 'react';
import { connect } from 'react-redux';
import * as R from 'ramda';

import 'moment/locale/zh-cn';

import { appActions, AppState, AsunaStore, AuthState, RootState } from '@asuna-admin/store';
import { AppContext, IIndexRegister, ILoginRegister, INextConfig } from '@asuna-admin/core';
import { MainLayout } from '@asuna-admin/layout';
import { createLogger } from '@asuna-admin/logger';

const logger = createLogger('pages:index', 'warn');

// --------------------------------------------------------------
// Index Component
// --------------------------------------------------------------

interface IIndexPageProps extends ReduxProps {
  auth: AuthState;
  app: AppState;
  register: ILoginRegister & IIndexRegister;
  appInfo: {
    userAgent: string;
  };
}

class IndexPage extends React.Component<IIndexPageProps> {
  constructor(props) {
    super(props);

    const { dispatch, register } = this.props;
    AppContext.setup({ register, module: 'index' });
    AppContext.regDispatch(dispatch);
    dispatch(appActions.init());
  }

  static async getInitialProps({ req }) {
    const userAgent = req ? req.headers['user-agent'] : navigator.userAgent;
    return {
      appInfo: { userAgent },
    };
  }

  render() {
    const {
      auth,
      app: { loading, heartbeat },
      appInfo,
    } = this.props;
    logger.debug('[render]', this.props);

    return <MainLayout loading={loading} heartbeat={heartbeat} auth={auth} appInfo={appInfo} />;
  }
}

const mapStateToProps = (state: RootState) => ({
  auth: state.auth,
  app: state.app,
});

// prettier-ignore
export const renderIndexPage = (props: Partial<IIndexPageProps>, nextConfig: INextConfig) => {
  AppContext.init(nextConfig);
  const store = new AsunaStore();
  return store.withReduxSaga<IIndexPageProps>(
    connect(R.compose(R.merge(props), mapStateToProps))(IndexPage as any),
  );
};
