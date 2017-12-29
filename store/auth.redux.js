import { call, put, takeLatest } from 'redux-saga/effects';

import { login } from '../services/auth';

import { routerActions } from './router.redux';

import { notificationsActionEvents, notificationTypes } from './notifications.redux';

// --------------------------------------------------------------
// Login actionTypes
// --------------------------------------------------------------

const actionTypes = {
  LOGIN        : 'auth::login',
  LOGIN_FAILED : 'auth::login-failed',
  LOGIN_SUCCESS: 'auth::login-success',
};

const isCurrentModule = type => type.startsWith('auth::');

// --------------------------------------------------------------
// Login actions
// --------------------------------------------------------------

const actionEvents = {
  // -
  login: (username, password) => ({ type: actionTypes.LOGIN, payload: { username, password } }),

  // -
  loginSuccess: token =>
    ({ type: actionTypes.LOGIN_SUCCESS, payload: { token, loginTime: new Date() } }),

  // -
  loginFailed: error => ({ type: actionTypes.LOGIN_FAILED, payload: {}, error }),
};

const actions = dispatch => ({
  login : (username, password) => dispatch(actionEvents.login(username, password)),
  toHome: () => dispatch(actionEvents.toHome()),
});

// --------------------------------------------------------------
// Login sagas
// --------------------------------------------------------------

function* loginSaga({ payload: { username, password } }) {
  try {
    const { data: { token } } = yield call(login, username, password);
    console.log('token is', token);
    yield put(actionEvents.loginSuccess(token));
    yield put(notificationsActionEvents.notify(`'${username}' login success`));
    yield put(routerActions.toHome());
  } catch (error) {
    console.error('login error', error);
    yield put(actionEvents.loginFailed(error));
    yield put(notificationsActionEvents.notify(error.message, notificationTypes.ERROR));
  }
}

// function* loginSagaWatcher() {
//
// }

const sagas = [
  takeLatest(actionTypes.LOGIN, loginSaga),
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
  if (isCurrentModule(action.type)) {
    switch (action.type) {
      // state 中移除 password
      case actionTypes.LOGIN:
      case actionTypes.LOGIN_FAILED:
        return { username: action.payload.username };
      default:
        return { ...previousState, ...action.payload };
    }
  } else {
    return previousState;
  }
};

export {
  actionTypes as authActionTypes,
  actionEvents as authActionEvents,
  actions as authActions,
  sagas as authSagas,
  reducer as authReducer,
};
