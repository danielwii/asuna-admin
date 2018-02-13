import React       from 'react';
import { connect } from 'react-redux';
import dynamic     from 'next/dynamic';
import PropTypes   from 'prop-types';
import _           from 'lodash';
import 'moment/locale/zh-cn';

import { withReduxSaga } from '../store';
import { menuActions }   from '../store/menu.redux';
import { modelsActions } from '../store/models.redux';

import { authService }   from '../services/auth';
import { modelsService } from '../services/models';
import { menuService }   from '../services/menu';
import { apiService }    from '../services/api';

import { AuthAdapter }       from '../adapters/auth';
import { ModelsAdapter }     from '../adapters/models';
import { MenuAdapter }       from '../adapters/menu';
import { PyResponseAdapter } from '../adapters/response';
import { createLogger }      from '../adapters/logger';
import { ApiAdapter }        from '../adapters/api';

import { modelConfigs, registeredModels } from '../services/definitions';

const logger = createLogger('pages:index');

// --------------------------------------------------------------
// Setup context
// --------------------------------------------------------------

global.context = _.assign(global.context, {
  auth    : new AuthAdapter(authService),
  response: new PyResponseAdapter(),
  models  : new ModelsAdapter(modelsService, modelConfigs),
  menu    : new MenuAdapter(menuService, registeredModels),
  api     : new ApiAdapter(apiService),
});

logger.info('global context is', global.context);

// --------------------------------------------------------------
// Dynamic load main layout
// --------------------------------------------------------------

const DynamicMainLayoutLoading = dynamic(
  import('../layout/main'),
  {
    loading: () => <p>loading...</p>,
  },
);

// --------------------------------------------------------------
// Index Component
// --------------------------------------------------------------

class Index extends React.Component {
  static propTypes = {
    auth: PropTypes.shape({}),
  };

  componentWillMount() {
    logger.log('componentWillMount...', this.props);
    const { dispatch } = this.props;
    dispatch(menuActions.init());
    dispatch(modelsActions.loadAllSchemas());
  }

  render() {
    const { auth } = this.props;

    return (
      <DynamicMainLayoutLoading auth={auth} />
    );
  }
}

const mapStateToProps = state => ({
  auth: state.auth,
});

export default withReduxSaga(connect(mapStateToProps)(Index));
