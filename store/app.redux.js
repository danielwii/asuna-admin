import { put, takeLatest } from 'redux-saga/effects';

import { reduxAction } from 'node-buffs';

import { securitySagaFunctions } from './security.redux';
import { menuSagaFunctions }     from './menu.redux';
import { modelsSagaFunctions }   from './models.redux';

import { createLogger } from '../adapters/logger';

const logger = createLogger('store:app');

// --------------------------------------------------------------
// Module actionTypes
// --------------------------------------------------------------

const appActionTypes = {
  // ACTION: 'module::action'
  INIT        : 'app::init',
  INIT_SUCCESS: 'app::init-success',
};

const isCurrent = type => type.startsWith('app::');

// --------------------------------------------------------------
// Module actions
// --------------------------------------------------------------

const appActions = {
  // action: (args) => ({ type, payload })
  init       : () => reduxAction(appActionTypes.INIT, { loading: true }),
  initSuccess: () => reduxAction(appActionTypes.INIT_SUCCESS, { loading: false }),
};

// --------------------------------------------------------------
// Module sagas
// function* actionSage(args) {
//   yield call; yield put({ type: actionType, payload: {} })
// }
// --------------------------------------------------------------

function* init() {
  try { // const { token } = yield select(state => state.auth);
    logger.log('[init]', 'load all roles...');
    yield securitySagaFunctions.loadAllRoles();
    logger.log('[init]', 'get current user...');
    yield securitySagaFunctions.getCurrentUser();
    logger.log('[init]', 'call init menu...');
    yield menuSagaFunctions.init();
    logger.log('[init]', 'load all schemas');
    yield modelsSagaFunctions.loadAllSchemas();
    yield put(appActions.initSuccess());
  } catch (e) {
    logger.error('[init]', e);
  }
}

const appSagas = [
  // takeLatest / takeEvery (actionType, actionSage)
  takeLatest(appActionTypes.INIT, init),
];

// --------------------------------------------------------------
// Module reducers
// action = { payload: any? }
// --------------------------------------------------------------

const initialState = {
  loading: true,
};

const appReducer = (previousState = initialState, action) => {
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
  appActionTypes,
  appActions,
  appSagas,
  appReducer,
};
