import React       from 'react';
import { connect } from 'react-redux';
import dynamic     from 'next/dynamic';
import PropTypes   from 'prop-types';

import 'moment/locale/zh-cn';

import { withReduxSaga } from '../store';
// eslint-disable-next-line import/extensions
import { appActions }    from '../store/app.actions';

import AntdLayout from '../layout/antd';
import Loading    from '../components/LivingLoading';

import { register }         from '../services/register';
import { createLogger, lv } from '../helpers';
import { appContext }       from '../app/context';

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
    loading: () => <p>main loading...</p>,
  },
);

// --------------------------------------------------------------
// Index Component
// --------------------------------------------------------------

class Index extends React.Component {
  static propTypes = {
    appInfo: PropTypes.shape({}),
    auth   : PropTypes.shape({}),
    app    : PropTypes.shape({
      loading: PropTypes.bool,
    }),
  };

  static async getInitialProps({ req }) {
    const userAgent = req ? req.headers['user-agent'] : navigator.userAgent;
    return {
      appInfo: { userAgent },
    };
  }

  componentWillMount() {
    logger.info('[componentWillMount]', this.props);
    const { dispatch } = this.props;
    appContext.regDispatch(dispatch);
    dispatch(appActions.init());
  }

  render() {
    const { auth, app: { loading, heartbeat }, appInfo } = this.props;
    logger.info('[render]', this.props);

    return (loading || !heartbeat)
      ? <AntdLayout><Loading heartbeat={heartbeat} /></AntdLayout>
      : <DynamicMainLayoutLoading auth={auth} appInfo={appInfo} />;
  }
}

const mapStateToProps = state => ({
  auth: state.auth,
  app : state.app,
});

export default withReduxSaga(connect(mapStateToProps)(Index));
