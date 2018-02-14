import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects';

import _           from 'lodash';
import { message } from 'antd';

import { authProxy }     from '../adapters/auth';
import { createLogger }  from '../adapters/logger';
import { routerActions } from './router.redux';

const logger = createLogger('store:auth');

// --------------------------------------------------------------
// Login actionTypes
// --------------------------------------------------------------

const actionTypes = {
  LOGIN        : 'auth::login',
  LOGOUT       : 'auth::logout',
  LOGIN_FAILED : 'auth::login-failed',
  LOGIN_SUCCESS: 'auth::login-success',
};

const isCurrent = type => type.startsWith('auth::');

// --------------------------------------------------------------
// Login actions
// --------------------------------------------------------------

const actions = {
  login       : (username, password) => ({
    type: actionTypes.LOGIN, payload: { username, password }, error: null,
  }),
  logout      : () => ({
    type: actionTypes.LOGOUT, payload: { token: null, loginTime: null }, error: null,
  }),
  loginSuccess: token => ({
    type: actionTypes.LOGIN_SUCCESS, payload: { token, loginTime: new Date() }, error: null,
  }),
  loginFailed : error => ({
    type: actionTypes.LOGIN_FAILED, payload: {}, error,
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
    yield put(actions.loginSuccess(token));
    message.info(`'${username}' login success`);
    yield put(routerActions.toIndex());
  } catch (error) {
    logger.error('[loginSaga]', error);
    if (error.response) {
      yield put(actions.loginFailed(error.response));
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
function* tokenWatcher() {
  // const action = yield take('*');
  const { auth: { token }, router: { path } } = yield select();
  if (!token && path !== '/login') {
    yield put(routerActions.toLogin());
  }
}

const sagas = [
  takeLatest(actionTypes.LOGIN, loginSaga),
  takeLatest(actionTypes.LOGOUT, logoutSaga),
  takeEvery('*', tokenWatcher),
];

// --------------------------------------------------------------
// Login reducers
// --------------------------------------------------------------

const initialState = {
  loginTime: null,
  username : null,
  token    : null,
};

const reducer = (previousState = initialState, action) => {
  if (isCurrent(action.type)) {
    switch (action.type) {
      // state 中移除 password
      // case actionTypes.LOGIN:
      // case actionTypes.LOGIN_FAILED:
      //   return { username: action.payload.username };
      default:
        return { ...previousState, ..._.omit(action.payload, 'password') };
    }
  } else {
    return previousState;
  }
};

export {
  actionTypes as authActionTypes,
  actions as authActions,
  sagas as authSagas,
  reducer as authReducer,
};
