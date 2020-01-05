import { apiProxy } from '@asuna-admin/adapters';
import { createLogger } from '@asuna-admin/logger';
import * as R from 'ramda';
import { REHYDRATE } from 'redux-persist';
import { call, put, select, take, takeEvery, takeLatest } from 'redux-saga/effects';

import { actions, RootState } from './';
import { appActions, appActionTypes, isAppModule } from './app.actions';
import { authActions } from './auth.actions';
import { menuSagaFunctions } from './menu.redux';
import { modelsSagaFunctions } from './models.redux';
import { routerActions } from './router.redux';
import { securitySagaFunctions } from './security.redux';

// import { Observable } from 'rxjs/Observable';

// import 'rxjs/scheduler/async';
// import 'rxjs/add/observable/interval';
// import 'rxjs/add/operator/delay';
// import 'rxjs/add/operator/switchMap';
// import 'rxjs/add/operator/mapTo';

const logger = createLogger('store:app');

// --------------------------------------------------------------
// Module sagas
// function* actionSage(args) {
//   yield call; yield put({ type: actionType, payload: {} })
// }
// --------------------------------------------------------------

function* init() {
  try {
    // store 未恢复时等待一个恢复信号
    const { restored } = yield select((state: RootState) => state.app);
    if (!restored) {
      yield take(REHYDRATE);
    }
    logger.log('[init]', 'get version...');
    // yield heartbeat();
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
    yield put(authActions.logout());
    logger.error('[init]', e, { e });
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
    logger.error('[sync]', e, { e });
  }
}

/**
 * 恢复 store 时跳转到主页面
 * @param action
 */
function* rehydrateWatcher(action) {
  logger.log('[rehydrateWatcher]', action);
  yield put(appActions.restored());
  const token = action?.payload?.auth?.token;
  const path = action?.payload?.router?.path;
  logger.log('[rehydrateWatcher]', !!token, path);
  if (token) {
    yield put(routerActions.toIndex());
  }
}

/**
 * 查询运行中的服务端版本，版本不一致时更新当前的版本，-同时进行同步操作-，目前修改为需要手动刷新
 */
function* heartbeat({ force }) {
  const app: AppState = yield select((state: RootState) => state.app);

  try {
    logger.debug('[heartbeat]', { app });

    const response = yield call(apiProxy.getVersion);
    logger.debug('[heartbeat]', { force, remote: response.data, version: app.version });

    // 版本不一致时执行同步操作
    if (force /*|| app.version !== response.data*/) {
      yield put(appActions.sync());
      yield put(appActions.loadVersionSuccess(response.data));
    }

    if (!app.heartbeat) {
      yield put(appActions.heartbeatAlive());
    }
  } catch (e) {
    logger.error('[heartbeat]', e, { e });
    if (app.heartbeat) {
      yield put(appActions.heartbeatStop());
    }
  }
}

const appSagas = [
  // takeLatest / takeEvery (actionType, actionSage)
  takeLatest(appActionTypes.INIT, init),
  takeLatest(appActionTypes.SYNC, sync),
  takeLatest(appActionTypes.HEARTBEAT as any, heartbeat),
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

export interface AppState {
  /**
   * null - 表示还未得到明确的连接状态
   * true | false - 表示真实的连接状态
   */
  heartbeat: boolean | null;
  loading: boolean;
  restored: boolean;
  version?: string;
}

const initialState: AppState = {
  heartbeat: null,
  loading: true, // 初始化状态，用于加载 loading 图
  restored: false, // 标记恢复状态，恢复后不再等待恢复信息
};

const appReducer = (previousState: AppState = initialState, action) => {
  if (isAppModule(action)) {
    return R.mergeDeepRight(previousState, action.payload);
  }
  return previousState;
};

export { appSagas, appEpics, appReducer };
