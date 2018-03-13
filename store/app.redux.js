import { put, select, take, takeEvery, takeLatest } from 'redux-saga/effects';

import { reduxAction } from 'node-buffs';
import { REHYDRATE }   from 'redux-persist/constants';
import _               from 'lodash';

import { securitySagaFunctions } from './security.redux';
import { menuSagaFunctions }     from './menu.redux';
import { modelsSagaFunctions }   from './models.redux';

import { routerActions } from './router.redux';
import { authActions }   from './auth.redux';
import { createLogger }  from '../adapters/logger';
import { actions }       from '.';

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
  RESTORED    : 'app::RESTORED',
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
  restored   : () => reduxAction(appActionTypes.RESTORED, { restored: true }),
};

// --------------------------------------------------------------
// Module sagas
// function* actionSage(args) {
//   yield call; yield put({ type: actionType, payload: {} })
// }
// --------------------------------------------------------------

function* init() {
  try {
    // store 未恢复时等待一个恢复信号
    const { restored } = yield select(state => state.app);
    if (!restored) {
      yield take(REHYDRATE);
    }

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
    yield put(authActions.logout());
    logger.error('[init]', e);
  }
}

function* sync() {
  try {
    yield put(actions.clean());
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

/**
 * 恢复 store 时跳转到主页面
 * @param action
 */
function* rehydrateWatcher(action) {
  logger.log('[rehydrateWatcher]', action);
  yield put(appActions.restored());
  const token = _.get(action, 'payload.auth.token');
  const path  = _.get(action, 'payload.router.path');
  logger.log('[rehydrateWatcher]', !!token, path);
  if (token) {
    yield put(routerActions.toIndex());
  }
}

const appSagas = [
  // takeLatest / takeEvery (actionType, actionSage)
  takeLatest(appActionTypes.INIT, init),
  takeLatest(appActionTypes.SYNC, sync),
  takeEvery(REHYDRATE, rehydrateWatcher),
];

// --------------------------------------------------------------
// Module reducers
// action = { payload: any? }
// --------------------------------------------------------------

const initialState = {
  loading : true,  // 初始化状态，用于加载 loading 图
  restored: false, // 标记恢复状态，恢复后不再等待恢复信息
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
