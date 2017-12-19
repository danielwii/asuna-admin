/* eslint-disable key-spacing */
import { put, takeEvery } from 'redux-saga/effects';

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

// export const triggerFirst = () => dispatch => dispatch({ type: actionTypes.LOGIN });

// --------------------------------------------------------------
// Login sagas
// --------------------------------------------------------------

export function* loginSaga() {
  console.log('------------------- all done2');
  try {
    yield put({ type: actionTypes.LOGIN_SUCCESS, data: 'done ^_^ done' });
  } catch (error) {
    yield put({ type: actionTypes.LOGIN_FAILED, error });
  }
}

// function* loginSagaWatcher() {
//
// }

export const sagas = [
  takeEvery(actionTypes.LOGIN, loginSaga),
];

// --------------------------------------------------------------
// Login reducers
// --------------------------------------------------------------

const initialState = {
  loginTime: null,
};

export const reducer = (previousState = initialState, action) => {
  console.log('previousState is', previousState, 'action is', action);
  switch (action.type) {
    default:
      return previousState;
      // return { ...state, ...action.payload };
  }
};

