import React from 'react';
import { connect } from 'react-redux';

import 'moment/locale/zh-cn';

import { register } from '../services/register';

import { RootState, withReduxSaga, appActions, AuthState, AppState } from '@asuna-admin/store';
import { createLogger } from '@asuna-admin/helpers';
import { appContext } from '@asuna-admin/core';
import { MainLayout } from '@asuna-admin/layout';

const logger = createLogger('pages:index', 'warn');

// --------------------------------------------------------------
// Setup context
// --------------------------------------------------------------

appContext.setup({ register, module: 'index' });

// --------------------------------------------------------------
// Index Component
// --------------------------------------------------------------

interface IProps extends ReduxProps {
  auth: AuthState;
  app: AppState;
  appInfo: {
    userAgent: string;
  };
}

class Index extends React.Component<IProps> {
  constructor(props) {
    super(props);
    const { dispatch } = this.props;
    appContext.regDispatch(dispatch);
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

export default withReduxSaga(connect(mapStateToProps)(Index));
