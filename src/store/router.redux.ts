import { createLogger } from '@asuna-admin/logger';
import * as R from 'ramda';
import { takeLatest } from 'redux-saga/effects';

const logger = createLogger('store:router');

// --------------------------------------------------------------
// Module routerActionTypes
// --------------------------------------------------------------

const routerActionTypes = {
  // ACTION: 'module::action'
  TO_INDEX: 'router::to-index',
  TO_HOME: 'router::to-home',
  TO_LOGIN: 'router::to-login',
  GOTO: 'router::goto',
};

export const isRouterModule = (action) => action.type.startsWith('router::') && !action.transient;

// --------------------------------------------------------------
// Module routerActions
// --------------------------------------------------------------

const routerActions = {
  // action: (args) => ({ type, payload })
  toIndex: () => ({ type: routerActionTypes.TO_INDEX, payload: { path: '/' } }),
  toHome: () => ({ type: routerActionTypes.TO_HOME, payload: { path: '/home' } }),
  toLogin: () => ({ type: routerActionTypes.TO_LOGIN, payload: { path: '/login' } }),
  goto: (path) => ({ type: routerActionTypes.GOTO, payload: { path } }),
};

// --------------------------------------------------------------
// Module routerSagas
// function* actionSage(args) {
//   yield call; yield puy({ type: actionType, payload: {} })
// }
// --------------------------------------------------------------

function* goto({ payload: { path } }) {
  const isCurrent = window.location.pathname !== path;
  logger.log('goto', { from: window.location.pathname, to: path, isCurrent });
  // yield Router.replace(path);
  if (isCurrent) window.location.pathname = path;
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

export interface RouterState {
  path: string | null;
}

const initialState: RouterState = {
  path: null,
};

const routerReducer = (previousState = initialState, action) => {
  if (isRouterModule(action)) {
    return R.mergeDeepRight(previousState, action.payload);
  }
  return previousState;
};

export { routerActionTypes, routerActions, routerSagas, routerReducer };
