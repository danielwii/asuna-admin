import React from 'react';
import { connect } from 'react-redux';

import 'moment/locale/zh-cn';

import { RootState, AsunaStore, appActions, AuthState, AppState } from '@asuna-admin/store';
import { createLogger } from '@asuna-admin/logger';
import { AppContext, IIndexRegister, ILoginRegister } from '@asuna-admin/core';
import { MainLayout } from '@asuna-admin/layout';

const logger = createLogger('pages:index', 'warn');

// --------------------------------------------------------------
// Index Component
// --------------------------------------------------------------

interface IProps extends ReduxProps {
  auth: AuthState;
  app: AppState;
  register: ILoginRegister & IIndexRegister;
  appInfo: {
    userAgent: string;
  };
}

class IndexPage extends React.Component<IProps> {
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

export const renderIndexPage = nextGetConfig => {
  const store = new AsunaStore(nextGetConfig);
  return store.withReduxSaga(connect(mapStateToProps)(IndexPage));
};
