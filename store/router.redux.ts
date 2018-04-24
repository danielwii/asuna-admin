import { takeLatest } from 'redux-saga/effects';

import Router from 'next/router';

// --------------------------------------------------------------
// Module actionTypes
// --------------------------------------------------------------

const actionTypes = {
  // ACTION: 'module::action'
  TO_INDEX: 'router::to-index',
  TO_HOME : 'router::to-home',
  TO_LOGIN: 'router::to-login',
  GOTO    : 'router::goto',
};

const isCurrent = type => type.startsWith('router::');

// --------------------------------------------------------------
// Module actions
// --------------------------------------------------------------

const actions = {
  // action: (args) => ({ type, payload })
  toIndex: () => ({ type: actionTypes.TO_INDEX, payload: { path: '/' } }),
  toHome : () => ({ type: actionTypes.TO_HOME, payload: { path: '/home' } }),
  toLogin: () => ({ type: actionTypes.TO_LOGIN, payload: { path: '/login' } }),
  goto   : path => ({ type: actionTypes.GOTO, payload: { path } }),
};

// --------------------------------------------------------------
// Module sagas
// function* actionSage(args) {
//   yield call; yield puy({ type: actionType, payload: {} })
// }
// --------------------------------------------------------------

async function goto({ payload: { path } }) {
  await Router.replace(path);
}

const sagas = [
  // takeLatest / takeEvery (actionType, actionSage)
  takeLatest(actionTypes.TO_INDEX as any, goto),
  takeLatest(actionTypes.TO_HOME as any, goto),
  takeLatest(actionTypes.TO_LOGIN as any, goto),
  takeLatest(actionTypes.GOTO as any, goto),
];

// --------------------------------------------------------------
// Module reducers
// action = { payload: any? }
// --------------------------------------------------------------

const initialState = {
  path: null,
};

const reducer = (previousState = initialState, action) => {
  if (isCurrent(action.type)) {
    switch (action.type) {
      default:
        return { ...action.payload };
    }
  } else {
    return previousState;
  }
};

export {
  actionTypes as routerActionTypes,
  actions as routerActions,
  sagas as routerSagas,
  reducer as routerReducer,
};
