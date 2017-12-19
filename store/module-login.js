import { put, takeEvery, takeLatest } from 'redux-saga/effects';

// --------------------------------------------------------------
// Login actionTypes
// --------------------------------------------------------------

export const actionTypes = {
  LOGIN        : 'login::login',
  LOGIN_FAILED : 'login::login_failed',
  LOGIN_SUCCESS: 'login::login_success',
};

// --------------------------------------------------------------
// Login actions
// --------------------------------------------------------------

export const actions = {
  login: dispatch => dispatch({ type: actionTypes.LOGIN }),
};

// --------------------------------------------------------------
// Login sagas
// --------------------------------------------------------------

export function* loginSaga() {
  try {
    // TODO login action
    yield put({ type: actionTypes.LOGIN_SUCCESS, data: 'done ^_^ done' });
  } catch (error) {
    yield put({ type: actionTypes.LOGIN_FAILED, error });
  }
}

// function* loginSagaWatcher() {
//
// }

export const sagas = [
  takeLatest(actionTypes.LOGIN, loginSaga),
];

// --------------------------------------------------------------
// Login reducers
// --------------------------------------------------------------

const initialState = {
  loginTime: null,
};

export const reducer = (previousState = initialState, action) => {
  switch (action.type) {
    default:
      return previousState;
    // return { ...state, ...action.payload };
  }
};

