import React       from 'react';
import { connect } from 'react-redux';
import dynamic     from 'next/dynamic';
import _           from 'lodash';
import moment      from 'moment';

import { withReduxSaga } from '../store';
import { menuActions }   from '../store/menu.redux';

import * as authService  from '../services/auth';
import { modelsService } from '../services/models';
import { menuService }   from '../services/menu';

import { JwtAuthAdapter } from '../adapters/auth';
import { ModelsAdapter }  from '../adapters/models';
import { MenuAdapter }    from '../adapters/menu';

import { PyResponseAdapter } from '../adapters/response';

import { modelColumns, tableColumns } from '../services/definations';

// --------------------------------------------------------------
// Setup context
// --------------------------------------------------------------

moment.locale('zh-cn');

global.context = _.assign(global.context, {
  auth    : new JwtAuthAdapter(authService),
  response: new PyResponseAdapter(),
  models  : new ModelsAdapter(modelsService, {
    colleges: { table: tableColumns.colleges, model: modelColumns.colleges },
  }),
  menu    : new MenuAdapter(menuService, [
    {
      key     : 'content',
      title   : '内容管理',
      subMenus: [
        { key: 'colleges', title: '院校管理', linkTo: 'content::index' },
      ],
    },
  ]),
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
    // dispatch(modelsActions.loadAllOptions());
  }

  render() {
    return (
      <DynamicMainLayoutLoading />
    );
  }
}

export default withReduxSaga(connect()(Index));
