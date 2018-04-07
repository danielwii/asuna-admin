import React       from 'react';
import { connect } from 'react-redux';
import dynamic     from 'next/dynamic';
import PropTypes   from 'prop-types';
import _           from 'lodash';

import 'moment/locale/zh-cn';

import { withReduxSaga } from '../store';
import { appActions }    from '../store/app.redux';

import AntdLayout from '../layout/antd';
import Loading    from '../components/LivingLoading';

import Register             from '../services/register';
import { AuthAdapter }      from '../adapters/auth';
import { SecurityAdapter }  from '../adapters/security';
import { ModelsAdapter }    from '../adapters/models';
import { MenuAdapter }      from '../adapters/menu';
import { ResponseAdapter }  from '../adapters/response';
import { ApiAdapter }       from '../adapters/api';
import { createLogger, lv } from '../helpers';

const logger = createLogger('pages:index', lv.warn);

// --------------------------------------------------------------
// Setup context
// --------------------------------------------------------------

global.context = _.assign(global.context, {
  auth    : new AuthAdapter(Register.createAuthService()),
  response: new ResponseAdapter(),
  menu    : new MenuAdapter(
    Register.createMenuService(),
    Register.createDefinitions().registeredModels,
  ),
  api     : new ApiAdapter(Register.createApiService()),
  security: new SecurityAdapter(Register.createSecurityService()),
  models  : new ModelsAdapter(
    Register.createModelsService(),
    Register.createDefinitions().modelConfigs,
    Register.createDefinitions().associations,
  ),
});

logger.info('global context is', global.context);

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
