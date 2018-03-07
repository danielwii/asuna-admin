import { call, put, select, take, takeEvery, takeLatest } from 'redux-saga/effects';

import _             from 'lodash';
import * as R        from 'ramda';
import { message }   from 'antd';
import { REHYDRATE } from 'redux-persist/constants';

import { authProxy }     from '../adapters/auth';
import { createLogger }  from '../adapters/logger';
import { routerActions } from './router.redux';

const logger = createLogger('store:auth');

// --------------------------------------------------------------
// Login actionTypes
// --------------------------------------------------------------

const authActionTypes = {
  LOGIN        : 'auth::login',
  LOGOUT       : 'auth::logout',
  LOGIN_FAILED : 'auth::login-failed',
  LOGIN_SUCCESS: 'auth::login-success',
};

const isCurrent = type => type.startsWith('auth::');

// --------------------------------------------------------------
// Login actions
// --------------------------------------------------------------

const authActions = {
  login       : (username, password) => ({
    // TODO using reduxAction instead
    type: authActionTypes.LOGIN, payload: { username, password }, error: null,
  }),
  logout      : () => ({
    type: authActionTypes.LOGOUT, payload: { token: null, loginTime: null }, error: null,
  }),
  loginSuccess: token => ({
    type: authActionTypes.LOGIN_SUCCESS, payload: { token, loginTime: new Date() }, error: null,
  }),
  loginFailed : error => ({
    type: authActionTypes.LOGIN_FAILED, payload: {}, error,
  }),
};

// --------------------------------------------------------------
// Login sagas
// --------------------------------------------------------------

function* loginSaga({ payload: { username, password } }) {
  try {
    logger.log('[loginSaga]');
    const response = yield call(authProxy.login, { body: { username, password } });
    logger.log('[loginSaga]', 'response is', response);
    const token = yield call(authProxy.extractToken, response.data);
    yield put(authActions.loginSuccess(token));
    message.info(`'${username}' login success`);
    yield put(routerActions.toIndex());
  } catch (error) {
    logger.error('[loginSaga]', error);
    if (error.response) {
      yield put(authActions.loginFailed(error.response));
      message.error(JSON.stringify(error.response.data));
    }
  }
}

function* logoutSaga() {
  try {
    logger.log('[logoutSaga]');
    const response = yield call(authProxy.logout);
    logger.log('[logoutSaga]', 'response is', response);
  } catch (error) {
    logger.error('[logoutSaga]', error);
  }
}

/**
 * 未找到可用 token 时重定向到登录页面
 */
function* tokenWatcher(action) {
  const { auth: { token }, router: { path } } = yield select();
  if (action.type === authActionTypes.LOGOUT) {
    yield put(routerActions.toLogin());
  } else if (!token && path !== '/login') {
    const rehydrateAction = yield take(REHYDRATE);
    logger.log('[tokenWatcher]', 'waiting for rehydrateAction', rehydrateAction);
    if (!_.get(rehydrateAction, 'payload.auth.token')) {
      yield put(routerActions.toLogin());
    }
  }
}

/**
 * 恢复 store 时跳转到主页面
 * @param action
 */
function* rehydrateWatcher(action) {
  logger.log('[rehydrateWatcher]', action);
  const token = _.get(action, 'payload.auth.token');
  const path  = _.get(action, 'payload.router.path');
  logger.log('[rehydrateWatcher]', !!token, path);
  if (token) {
    yield put(routerActions.toIndex());
  }
}

const authSagas = [
  takeLatest(authActionTypes.LOGIN, loginSaga),
  takeLatest(authActionTypes.LOGOUT, logoutSaga),
  takeEvery('*', tokenWatcher),
  takeEvery(REHYDRATE, rehydrateWatcher),
];

// --------------------------------------------------------------
// Login reducers
// --------------------------------------------------------------

const initialState = {
  loginTime: null,
  username : null,
  token    : null,
};

const authReducer = (previousState = initialState, action) => {
  if (isCurrent(action.type)) {
    switch (action.type) {
      default:
        return R.mergeDeepRight(previousState, _.omit(action.payload, 'password'));
    }
  } else {
    return previousState;
  }
};

export {
  authActionTypes,
  authActions,
  authSagas,
  authReducer,
};
