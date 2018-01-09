import React       from 'react';
import { connect } from 'react-redux';
import dynamic     from 'next/dynamic';
import _           from 'lodash';

import { withReduxSaga } from '../store';
import { menuActions }   from '../store/menu.redux';
import { modelsActions } from '../store/models.redux';

import * as authService   from '../services/auth';
import { modelsService }  from '../services/models';
import { JwtAuthAdapter } from '../adapters/auth';
import { ModelsAdapter }  from '../adapters/models';

// --------------------------------------------------------------
// Setup context
// --------------------------------------------------------------

global.context = _.assign(global.context, {
  auth  : new JwtAuthAdapter(authService),
  models: new ModelsAdapter(modelsService, ['colleges']),
});

console.log('2--> global context is', global.context);

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
    console.log('componentWillMount...');
    const { dispatch } = this.props;
    dispatch(menuActions.init());
    dispatch(modelsActions.loadAllOptions());
  }

  render() {
    return (
      <DynamicMainLayoutLoading />
    );
  }
}

export default withReduxSaga(connect()(Index));
