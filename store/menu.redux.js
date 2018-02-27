import { put, select, takeLatest } from 'redux-saga/effects';

import * as R from 'ramda';

import { menuProxy }    from '../adapters/menu';
import { createLogger } from '../adapters/logger';

const logger = createLogger('store:menu');

// --------------------------------------------------------------
// Module actionTypes
// --------------------------------------------------------------

const actionTypes = {
  // ACTION: 'module::action'
  INIT        : 'menu::init',
  INIT_SUCCESS: 'menu::init-success',
};

const isCurrent = type => type.startsWith('menu::');

// --------------------------------------------------------------
// Module actions
// --------------------------------------------------------------

const actions = {
  init: () => ({ type: actionTypes.INIT }),
};

// --------------------------------------------------------------
// Module sagas
// function* actionSage(args) {
//   yield call; yield puy({ type: actionType, payload: {} })
// }
// --------------------------------------------------------------

const sagaFunctions = {
  * init() {
    const { roles, user } = yield select(state => state.security);

    if (user) {
      if (R.prop('items')(roles)) {
        const currentRoles = R.compose(
          R.filter(role => R.contains(role.id)(user.roles)),
          R.propOr([], 'items'),
        )(roles);
        logger.info('[init]', 'current roles is', currentRoles);

        const isSysAdmin = R.compose(
          R.not,
          R.isEmpty,
          R.find(role => role.name === 'SYS_ADMIN'),
        )(currentRoles);
        logger.info('[init]', 'current user isSysAdmin', isSysAdmin);

        const authoritiesList = R.map(R.prop('authorities'))(currentRoles);
        logger.info('[init]', 'current authoritiesList is', authoritiesList);

        const authorities = R.reduce(R.mergeWith(R.or), {})(authoritiesList);
        logger.info('[init]', 'current authorities is', authorities);

        const menus = yield menuProxy.init(isSysAdmin, authorities);
        logger.log('[init]', 'init sage, menus is', menus);

        yield put({ type: actionTypes.INIT_SUCCESS, payload: { menus } });
      } else {
        logger.warn('[init]', 'cannot found any roles');
      }
    } else {
      logger.warn('[init]', 'cannot found current user');
    }
  },
};


const sagas = [
  // takeLatest / takeEvery (actionType, actionSage)
  takeLatest(actionTypes.INIT, sagaFunctions.init),
];

// --------------------------------------------------------------
// Module reducers
// action = { payload: any? }
// --------------------------------------------------------------

const initialState = {
  // openKey  : null,
  // activeKey: null,
  menus: [],
};

const reducer = (previousState = initialState, action) => {
  if (isCurrent(action.type)) {
    switch (action.type) {
      default:
        return { ...previousState, ...action.payload };
    }
  } else {
    return previousState;
  }
};

export {
  actionTypes as menuActionTypes,
  actions as menuActions,
  sagas as menuSagas,
  reducer as menuReducer,
  sagaFunctions as menuSagaFunctions,
};
