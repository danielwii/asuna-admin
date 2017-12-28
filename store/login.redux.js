import PropTypes                 from 'prop-types';
import { call, put, takeLatest } from 'redux-saga/effects';

import { login } from '../services/auth';

import { notificationsActionEvents, notificationTypes } from './notifications.redux';

// --------------------------------------------------------------
// Login actionTypes
// --------------------------------------------------------------

const actionTypes = {
  LOGIN        : 'login::login',
  LOGIN_FAILED : 'login::login_failed',
  LOGIN_SUCCESS: 'login::login_success',
};

const isCurrentModule = type => type.startsWith('login::');

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
  loginFailed: error => ({ type: actionTypes.LOGIN_FAILED, error }),
};

const actions = {
  login: (username, password) => dispatch => dispatch(actionEvents.login(username, password)),
};

// --------------------------------------------------------------
// Login sagas
// --------------------------------------------------------------

function* loginSaga({ payload: { username, password } }) {
  try {
    // TODO login action
    const { data: { token } } = yield call(login, username, password);
    console.log('token is', token);
    yield put(actionEvents.loginSuccess(token));
    yield put(notificationsActionEvents.notify(`'${username}' login success`));
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

const shape = PropTypes.shape({
  loginTime: PropTypes.instanceOf(Date),
  username : PropTypes.string,
  token    : PropTypes.string,
});

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
  actionTypes as loginActionTypes,
  actionEvents as loginActionEvents,
  actions as loginActions,
  sagas as loginSagas,
  reducer as loginReducer,
  shape as loginShape,
};
