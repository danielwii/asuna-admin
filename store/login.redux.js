import PropTypes from 'prop-types';
import { call, put, takeLatest } from 'redux-saga/effects';

import { login } from '../services/auth';
import { notificationsActionEvents } from './notifications.redux';

// --------------------------------------------------------------
// Login actionTypes
// --------------------------------------------------------------

const actionTypes = {
  LOGIN        : 'login::login',
  LOGIN_FAILED : 'login::login_failed',
  LOGIN_SUCCESS: 'login::login_success',
};

// --------------------------------------------------------------
// Login actions
// --------------------------------------------------------------

const actionEvents = {
  login: (username, password) => ({ type: actionTypes.LOGIN, payload: { username, password } }),
};

const actions = {
  login: (username, password) => dispatch => dispatch(actionEvents.login(username, password)),
};

// --------------------------------------------------------------
// Login sagas
// --------------------------------------------------------------

function* loginSaga(username, password) {
  try {
    // TODO login action
    // const result = yield login(username, password);
    const result = yield call(login, username, password);
    console.log('login is', result);
    yield put({
      type   : actionTypes.LOGIN_SUCCESS,
      payload: { message: 'done ^_^ done' },
      error  : {},
    });
    yield put(notificationsActionEvents.notify(`'${username}' login success`));
  } catch (error) {
    console.error('login error', error.stack);
    yield put({
      type   : actionTypes.LOGIN_FAILED,
      payload: {},
      error,
    });
    yield put(notificationsActionEvents.notify(error.message));
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
};

const shape = PropTypes.shape({
  loginTime: PropTypes.instanceOf(Date),
  username : PropTypes.string,
});

const reducer = (previousState = initialState, action) => {
  switch (action.type) {
    case actionTypes.LOGIN:
      return { ...previousState, login: action.payload.username };
    default:
      return previousState;
    // return { ...state, ...action.payload };
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

