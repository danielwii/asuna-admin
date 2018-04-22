import { call, put, select, take, takeEvery, takeLatest } from 'redux-saga/effects';

import { reduxAction } from 'node-buffs';
import { REHYDRATE }   from 'redux-persist/constants';
import _               from 'lodash';
import * as R          from 'ramda';

// import { Observable } from 'rxjs/Observable';

// import 'rxjs/scheduler/async';
// import 'rxjs/add/observable/interval';
// import 'rxjs/add/operator/delay';
// import 'rxjs/add/operator/switchMap';
// import 'rxjs/add/operator/mapTo';

import { securitySagaFunctions } from './security.redux';
import { menuSagaFunctions }     from './menu.redux';
import { modelsSagaFunctions }   from './model.redux';
import { routerActions }         from './router.redux';
import { authActions }           from './auth.redux';

import { actions }      from '.';
import { apiProxy }     from '../adapters/api';
import { createLogger } from '../helpers/index';

const logger = createLogger('store:app');

// --------------------------------------------------------------
// Module actionTypes
// --------------------------------------------------------------

const appActionTypes = {
  // ACTION: 'module::action'
  INIT               : 'app::init',
  SYNC               : 'app::sync',
  INIT_SUCCESS       : 'app::init-success',
  SYNC_SUCCESS       : 'app::sync-success',
  RESTORED           : 'app::RESTORED',
  // PING           : 'app::ping',
  // PONG           : 'app::pong',
  GET_VERSION        : 'app::get-version',
  GET_VERSION_SUCCESS: 'app::get-version-success',
  HEARTBEAT_ALIVE    : 'app::heartbeat-alive',
  HEARTBEAT_STOP     : 'app::heartbeat-stop',
};

const isCurrent = type => type.startsWith('app::');

// --------------------------------------------------------------
// Module actions
// --------------------------------------------------------------

const appActions = {
  // action: (args) => ({ type, payload })
  sync             : () => reduxAction(appActionTypes.SYNC, { loading: true }),
  syncSuccess      : () => reduxAction(appActionTypes.SYNC_SUCCESS, { loading: false }),
  init             : () => reduxAction(appActionTypes.INIT, { loading: true }),
  initSuccess      : () => reduxAction(appActionTypes.INIT_SUCCESS, { loading: false }),
  restored         : () => reduxAction(appActionTypes.RESTORED, { restored: true }),
  // ping          : () => reduxAction(appActionTypes.PING),
  // pong          : version => reduxAction(appActionTypes.PONG, { version }),
  getVersion       : () => reduxAction(appActionTypes.GET_VERSION),
  getVersionSuccess: version => reduxAction(appActionTypes.GET_VERSION_SUCCESS, { version }),
  heartbeatAlive   : () => reduxAction(appActionTypes.HEARTBEAT_ALIVE, { heartbeat: true }),
  heartbeatStop    : () => reduxAction(appActionTypes.HEARTBEAT_STOP, { heartbeat: false }),
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

    logger.log('[init]', 'get version...');
    // eslint-disable-next-line no-use-before-define
    yield getVersion();
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

/**
 * 查询运行中的服务端版本，版本不一致时更新当前的版本，同时进行同步操作
 */
// eslint-disable-next-line no-unused-vars
function* ping() {
  const { token }     = yield select(state => state.auth);
  const { heartbeat } = yield select(state => state.app);

  try {
    const response    = yield call(apiProxy.getVersion, { token });
    const { version } = yield select(R.prop('app'));
    logger.info('[ping]', { response, version });

    if (!!version && R.not(R.equals(version, response.data))) {
      yield put(appActions.sync());
    }

    yield put(appActions.pong(response.data));
    if (!heartbeat) {
      yield put(appActions.heartbeatAlive());
    }
  } catch (e) {
    logger.error('[ping]', e);
    if (heartbeat) {
      yield put(appActions.heartbeatStop());
    }
  }
}

/**
 * 查询运行中的服务端版本，版本不一致时更新当前的版本，同时进行同步操作
 */
function* getVersion() {
  const { token }              = yield select(state => state.auth);
  const { version, heartbeat } = yield select(state => state.app);

  try {
    const response = yield call(apiProxy.getVersion, { token });
    logger.info('[version]', { response });

    if (!!version && R.not(R.equals(version, response.data))) {
      yield put(appActions.sync());
    }

    yield put(appActions.getVersionSuccess(response.data));
    if (!heartbeat) {
      yield put(appActions.heartbeatAlive());
    }
  } catch (e) {
    logger.error('[ping]', e);
    if (heartbeat) {
      yield put(appActions.heartbeatStop());
    }
  }
}

const appSagas = [
  // takeLatest / takeEvery (actionType, actionSage)
  takeLatest(appActionTypes.INIT, init),
  takeLatest(appActionTypes.SYNC, sync),
  // takeLatest(appActionTypes.PING, ping),
  takeLatest(appActionTypes.GET_VERSION, getVersion),
  takeEvery(REHYDRATE, rehydrateWatcher),
];

// --------------------------------------------------------------
// Epics by redux-observable
// --------------------------------------------------------------

const appEpics = [
  // action$ => action$.ofType(ACTION)
  // action$ => action$.ofType(appActionTypes.INIT_SUCCESS)
  //   .delay(3000)
  //   .switchMap(() => Observable.interval(60 * 1000).mapTo(appActions.ping())),
];


// --------------------------------------------------------------
// Module reducers
// action = { payload: any? }
// --------------------------------------------------------------

const initialState = {
  heartbeat: false,
  loading  : true,  // 初始化状态，用于加载 loading 图
  restored : false, // 标记恢复状态，恢复后不再等待恢复信息
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
  appEpics,
  appReducer,
};
