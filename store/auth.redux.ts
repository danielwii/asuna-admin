import { call, put, select, take, takeEvery, takeLatest } from 'redux-saga/effects';

import _             from 'lodash';
import * as R        from 'ramda';
import { message }   from 'antd';
import { REHYDRATE } from 'redux-persist/constants';

import { authActions, authActionTypes, isAvailable } from './auth.actions';

import { RootState }        from './';
import { authProxy }        from '../adapters/auth';
import { panesActions }     from './panes.actions';
import { routerActions }    from './router.redux';
import { createLogger, lv } from '../helpers';

const logger = createLogger('store:auth', lv.warn);

// --------------------------------------------------------------
// Login sagas
// --------------------------------------------------------------

function* loginSaga({ payload: { username, password } }) {
  const auth: AuthState = yield select<RootState>(state => state.auth);
  try {
    // 切换用户时更新操作区域，如果未来需要保存当前页面配置的话，应该将切换操作提出为单独的 Saga

    if (auth.username !== username) {
      yield put(panesActions.closeAll());
    }

    const response = yield call(authProxy.login, username, password);
    logger.log('[loginSaga]', 'response is', response);
    const token = yield call(authProxy.extractToken, response.data);
    yield put(authActions.loginSuccess(username, token));
    message.info(`'${username}' login success`);
    yield put(routerActions.toIndex());
  } catch (e) {
    logger.error('[loginSaga]', { e });
    if (e.response) {
      yield put(authActions.loginFailed(e.response));
      message.error(JSON.stringify(e.response.data));
    }
  }
}

function* logoutSaga() {
  try {
    logger.log('[logoutSaga]');
    const response = yield call(authProxy.logout);
    logger.log('[logoutSaga]', 'response is', response);
  } catch (e) {
    logger.error('[logoutSaga]', { e });
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

const authSagas = [
  takeLatest(authActionTypes.LOGIN as any, loginSaga),
  takeLatest(authActionTypes.LOGOUT, logoutSaga),
  takeEvery('*', tokenWatcher),
];

// --------------------------------------------------------------
// Login reducers
// --------------------------------------------------------------

interface AuthState {
  loginTime: Date | null;
  username: string | null;
  token: string | null;
}

const initialState: AuthState = {
  loginTime: null,
  username : null,
  token    : null,
};

const authReducer = (previousState: AuthState = initialState, action) => {
  if (isAvailable(action)) {
    switch (action.type) {
      default:
        return R.mergeDeepRight(previousState, _.omit(action.payload, 'password'));
    }
  } else {
    return previousState;
  }
};

export {
  authSagas,
  authReducer,
  AuthState,
};
