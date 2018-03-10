import { put, select, take, takeLatest } from 'redux-saga/effects';

import { reduxAction } from 'node-buffs';
import { REHYDRATE }   from 'redux-persist/constants';

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
  SYNC        : 'app::sync',
  INIT_SUCCESS: 'app::init-success',
  SYNC_SUCCESS: 'app::sync-success',
};

const isCurrent = type => type.startsWith('app::');

// --------------------------------------------------------------
// Module actions
// --------------------------------------------------------------

const appActions = {
  // action: (args) => ({ type, payload })
  sync       : () => reduxAction(appActionTypes.SYNC, { loading: true }),
  init       : () => reduxAction(appActionTypes.INIT, { loading: true }),
  syncSuccess: () => reduxAction(appActionTypes.SYNC_SUCCESS, { loading: false }),
  initSuccess: () => reduxAction(appActionTypes.INIT_SUCCESS, { loading: false }),
};

// --------------------------------------------------------------
// Module sagas
// function* actionSage(args) {
//   yield call; yield put({ type: actionType, payload: {} })
// }
// --------------------------------------------------------------

function* init() {
  try {
    yield take(REHYDRATE);

    logger.log('[init]', 'load all roles...');
    yield securitySagaFunctions.loadAllRoles();
    logger.log('[init]', 'get current user...');
    yield securitySagaFunctions.getCurrentUser();
    logger.log('[init]', 'call init menu...');
    yield menuSagaFunctions.init();

    // 初始化时仅当无法找到当前的 schemas 时重新拉取所有模型定义
    const models = yield select(state => state.models);
    if (!models.schemas) {
      logger.log('[init]', 'load all schemas');
      yield modelsSagaFunctions.loadAllSchemas();
    }

    yield put(appActions.initSuccess());
  } catch (e) {
    logger.error('[init]', e);
  }
}

function* sync() {
  try {
    logger.log('[sync]', 'load all roles...');
    yield securitySagaFunctions.loadAllRoles();
    logger.log('[sync]', 'get current user...');
    yield securitySagaFunctions.getCurrentUser();
    logger.log('[sync]', 'call init menu...');
    yield menuSagaFunctions.init();
    logger.log('[sync]', 'load all schemas');
    yield modelsSagaFunctions.loadAllSchemas();
    yield put(appActions.syncSuccess());
  } catch (e) {
    logger.error('[sync]', e);
  }
}

const appSagas = [
  // takeLatest / takeEvery (actionType, actionSage)
  takeLatest(appActionTypes.INIT, init),
  takeLatest(appActionTypes.SYNC, sync),
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
