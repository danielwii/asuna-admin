import React       from 'react';
import { connect } from 'react-redux';
import dynamic     from 'next/dynamic';
import _           from 'lodash';
import 'moment/locale/zh-cn';

import { withReduxSaga } from '../store';
import { menuActions }   from '../store/menu.redux';
import { modelsActions } from '../store/models.redux';

import * as authService  from '../services/auth';
import { modelsService } from '../services/models';
import { menuService }   from '../services/menu';
import { apiService }    from '../services/api';

import { JwtAuthAdapter }    from '../adapters/auth';
import { ModelsAdapter }     from '../adapters/models';
import { MenuAdapter }       from '../adapters/menu';
import { PyResponseAdapter } from '../adapters/response';
import { createLogger }      from '../adapters/logger';
import { ApiAdapter }        from '../adapters/api';

import { modelConfigs, registeredModels } from '../services/definations';

const logger = createLogger('pages:index');

// --------------------------------------------------------------
// Setup context
// --------------------------------------------------------------

global.context = _.assign(global.context, {
  auth    : new JwtAuthAdapter(authService),
  response: new PyResponseAdapter(),
  models  : new ModelsAdapter(modelsService, modelConfigs),
  menu    : new MenuAdapter(menuService, registeredModels),
  api     : new ApiAdapter(apiService),
});

logger.info('global context is', global.context);

// --------------------------------------------------------------
// Define main app dynamic loader
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
  componentWillMount() {
    logger.info('componentWillMount...');
    const { dispatch } = this.props;
    dispatch(menuActions.init());
    dispatch(modelsActions.loadAllSchemas());
  }

  render() {
    return (
      <DynamicMainLayoutLoading />
    );
  }
}

export default withReduxSaga(connect()(Index));
