import React       from 'react';
import { connect } from 'react-redux';
import dynamic     from 'next/dynamic';

import 'moment/locale/zh-cn';

import { RootState, withReduxSaga } from '../store';
import { appActions }               from '../store/app.actions';

import { register }         from '../services/register';
import { createLogger, lv } from '../helpers';
import { appContext }       from '../app/context';
import { AuthState }        from 'store/auth.redux';
import { AppState }         from 'store/app.redux';

const logger = createLogger('pages:index', lv.warn);

// --------------------------------------------------------------
// Setup context
// --------------------------------------------------------------

appContext.setup({ module: 'index', register });

// --------------------------------------------------------------
// Dynamic load main layout
// --------------------------------------------------------------

const DynamicMainLayoutLoading = dynamic(
  import('../layout/main'),
  {
    loading: () => <div>&nbsp;</div>,
  },
);

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
    const { auth, app: { loading, heartbeat }, appInfo } = this.props;
    logger.info('[render]', this.props);

    return <DynamicMainLayoutLoading loading={loading} heartbeat={heartbeat} auth={auth} appInfo={appInfo} />;
  }
}

const mapStateToProps = (state: RootState) => ({
  auth: state.auth,
  app : state.app,
});

export default withReduxSaga(connect(mapStateToProps)(Index));
