import { message } from 'antd';
import localforage from 'localforage';
import * as R from 'ramda';
import { REHYDRATE } from 'redux-persist';
import { call, put, select, take, takeEvery, takeLatest } from 'redux-saga/effects';

import { authProxy } from '../adapters/proxy';
import { AppNavigator } from '../context/navigator';
import { toErrorMessage } from '../helpers/error';
import { createLogger } from '../logger';
import { appActionTypes } from './app.actions';
import { authActions, authActionTypes, isAuthModule } from './auth.actions';

import type { RootState } from './types';

const logger = createLogger('store:auth', 'debug');

// --------------------------------------------------------------
// Login sagas
// --------------------------------------------------------------

function* loginSaga({ payload: { username, password }, callback }) {
  const auth: AuthState = yield select((state: RootState) => state.auth);
  try {
    const response = yield call(authProxy.login, username, password);
    logger.log('[loginSaga]', 'response is', response);

    // 切换用户时更新操作区域，如果未来需要保存当前页面配置的话，应该将切换操作提出为单独的 Saga
    if (auth.username !== username) {
      logger.warn(`should close all panes...`);
      // yield put(panesActions.closeAll());
    }
    if (callback) callback({ response });

    const token = yield call(authProxy.extractToken, response.data);
    yield put(authActions.loginSuccess(username, token));
    message.info(`'${username}' login success`);

    return AppNavigator.toIndex();
  } catch (error) {
    logger.error('[loginSaga]', { error });
    try {
      if (callback !== null) callback({ error });
    } catch (e) {
      logger.warn('[upsert] callback error', e, { e });
    }
    if (error.response) {
      yield put(authActions.loginFailed(error.response));
      message.error(toErrorMessage(error));
    }
  }
}

function* logoutSaga() {
  try {
    logger.log('[logoutSaga]');
    const response = yield call(authProxy.logout);
    logger.log('[logoutSaga]', 'response is', response);
    localforage.clear();
  } catch (e) {
    logger.error('[logoutSaga]', { e });
  }
}

/**
 * 未找到可用 token 时重定向到登录页面
 */
function* tokenWatcher(action) {
  const {
    auth: { token },
  } = yield select((state: RootState) => ({ auth: state.auth }));
  // restored will be handled later at yield take(appActionTypes.RESTORED), simply ignore here
  if ([appActionTypes.RESTORED].includes(action.type)) {
    return;
  }

  if (action.type === REHYDRATE) {
    logger.log('[tokenWatcher]', 'REHYDRATE found, wait to restore...');
    const restoredAction = yield take(appActionTypes.RESTORED);
    logger.log('[tokenWatcher]', 'waiting for app restored', restoredAction);
    const auth: AuthState = yield select((state: RootState) => state.auth);
    if (!auth?.token && !AppNavigator.isLogin()) {
      logger.log('[tokenWatcher]', 'invalid auth token, back to login');
      return AppNavigator.toLogin();
    }
  } else if (action.type === authActionTypes.LOGOUT) {
    logger.log('[tokenWatcher]', 'logout...');
    return AppNavigator.toLogin();
  } else if (!token && !AppNavigator.isLogin()) {
    logger.log('[tokenWatcher]', 'no token found and path is not login, goto login');
    return AppNavigator.toLogin();
  } /*else if (!path) {
    logger.warn('[tokenWatcher]', 'no path found, redirect to login...');
    // yield put(routerActions.toLogin());
    // return AppNavigator.toLogin();
  }*/
}

const authSagas = [
  takeLatest(authActionTypes.LOGIN as any, loginSaga),
  takeLatest(authActionTypes.LOGOUT, logoutSaga),
  takeEvery('*', tokenWatcher),
];

// --------------------------------------------------------------
// Login reducers
// --------------------------------------------------------------

export interface AuthState {
  loginTime: Date | null;
  username: string | null;
  token: string | null;
}

const initialState: AuthState = {
  loginTime: null,
  username: null,
  token: null,
};

const authReducer = (previousState: AuthState = initialState, action) => {
  if (isAuthModule(action)) {
    return R.mergeDeepRight(previousState, action.payload);
  }
  return previousState;
};

export { authSagas, authReducer };
