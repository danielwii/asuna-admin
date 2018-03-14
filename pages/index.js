import React       from 'react';
import { connect } from 'react-redux';
import dynamic     from 'next/dynamic';
import PropTypes   from 'prop-types';
import _           from 'lodash';

import 'moment/locale/zh-cn';

import { withReduxSaga } from '../store';
import { appActions }    from '../store/app.redux';

import Loading from '../components/LivingLoading';

import { authService }     from '../services/auth';
import { securityService } from '../services/security';
import { modelsService }   from '../services/models';
import { menuService }     from '../services/menu';
import { apiService }      from '../services/api';

import { AuthAdapter }       from '../adapters/auth';
import { SecurityAdapter }   from '../adapters/security';
import { ModelsAdapter }     from '../adapters/models';
import { MenuAdapter }       from '../adapters/menu';
import { PyResponseAdapter } from '../adapters/response';
import { createLogger }      from '../adapters/logger';
import { ApiAdapter }        from '../adapters/api';

import { modelConfigs, registeredModels, associations } from '../services/definitions';

const logger = createLogger('pages:index');

// --------------------------------------------------------------
// Setup context
// --------------------------------------------------------------

global.context = _.assign(global.context, {
  auth    : new AuthAdapter(authService),
  response: new PyResponseAdapter(),
  models  : new ModelsAdapter(modelsService, modelConfigs, associations),
  menu    : new MenuAdapter(menuService, registeredModels),
  api     : new ApiAdapter(apiService),
  security: new SecurityAdapter(securityService),
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
    auth: PropTypes.shape({}),
    app : PropTypes.shape({
      loading: PropTypes.bool,
    }),
  };

  componentWillMount() {
    logger.log('componentWillMount...', this.props);
    const { dispatch } = this.props;
    dispatch(appActions.init());
  }

  render() {
    const { auth, app: { loading } } = this.props;

    return loading ? <Loading /> : <DynamicMainLayoutLoading auth={auth} />;
  }
}

const mapStateToProps = state => ({
  auth: state.auth,
  app : state.app,
});

export default withReduxSaga(connect(mapStateToProps)(Index));
