import { put, takeLatest } from 'redux-saga/effects';

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

function* init() {
  logger.log('[menu]', 'init sage, call getMenus...');
  const menus = yield menuProxy.init();
  logger.log('[menu]', 'init sage, menus is', menus);
  yield put({ type: actionTypes.INIT_SUCCESS, payload: { menus } });
}

const sagas = [
  // takeLatest / takeEvery (actionType, actionSage)
  takeLatest(actionTypes.INIT, init),
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
};
