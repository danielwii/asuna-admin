import { takeLatest } from 'redux-saga/effects';

import Router from 'next/router';
import * as R from 'ramda';

// --------------------------------------------------------------
// Module routerActionTypes
// --------------------------------------------------------------

const routerActionTypes = {
  // ACTION: 'module::action'
  TO_INDEX: 'router::to-index',
  TO_HOME : 'router::to-home',
  TO_LOGIN: 'router::to-login',
  GOTO    : 'router::goto',
};

export const isAvailable = action => action.type.startsWith('router::') && !action.transient;


// --------------------------------------------------------------
// Module routerActions
// --------------------------------------------------------------

const routerActions = {
  // action: (args) => ({ type, payload })
  toIndex: () => ({ type: routerActionTypes.TO_INDEX, payload: { path: '/' } }),
  toHome : () => ({ type: routerActionTypes.TO_HOME, payload: { path: '/home' } }),
  toLogin: () => ({ type: routerActionTypes.TO_LOGIN, payload: { path: '/login' } }),
  goto   : path => ({ type: routerActionTypes.GOTO, payload: { path } }),
};

// --------------------------------------------------------------
// Module routerSagas
// function* actionSage(args) {
//   yield call; yield puy({ type: actionType, payload: {} })
// }
// --------------------------------------------------------------

function goto({ payload: { path } }) {
  Router.replace(path);
}

const routerSagas = [
  // takeLatest / takeEvery (actionType, actionSage)
  takeLatest(routerActionTypes.TO_INDEX as any, goto),
  takeLatest(routerActionTypes.TO_HOME as any, goto),
  takeLatest(routerActionTypes.TO_LOGIN as any, goto),
  takeLatest(routerActionTypes.GOTO as any, goto),
];

// --------------------------------------------------------------
// Module routerReducers
// action = { payload: any? }
// --------------------------------------------------------------

const initialState = {
  path: null,
};

const routerReducer = (previousState = initialState, action) => {
  if (isAvailable(action)) {
    return R.mergeDeepRight(previousState, action.payload);
  } else {
    return previousState;
  }
};

export {
  routerActionTypes,
  routerActions,
  routerSagas,
  routerReducer,
};
