import { securityProxy } from '@asuna-admin/adapters';
import { TimelineMessageBox, toErrorMessage } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';

import { reduxAction } from 'node-buffs';
import * as R from 'ramda';
import { call, put, select, takeLatest } from 'redux-saga/effects';

import { RootState } from './';
import { authActions } from './auth.actions';

const logger = createLogger('store:security');

// --------------------------------------------------------------
// Module actionTypes
// --------------------------------------------------------------

const securityActionTypes = {
  // ACTION: 'security::action'
  LOAD_ALL_ROLES: 'security::load-all-roles',
  LOAD_ALL_ROLES_SUCCESS: 'security::load-all-roles-success',

  GET_CURRENT_USER: 'security::get-current-user',
  GET_CURRENT_USER_SUCCESS: 'security::get-current-user-success',

  UPDATE_PASSWORD: 'security::update-password',
};

const isSecurityModule = action => action.type.startsWith('security::') && !action.transient;

// --------------------------------------------------------------
// Module actions
// --------------------------------------------------------------

const securityActions = {
  // action: (args) => ({ type, payload })
  loadAllRoles: () => reduxAction(securityActionTypes.LOAD_ALL_ROLES),
  loadAllRolesSuccess: roles => reduxAction(securityActionTypes.LOAD_ALL_ROLES_SUCCESS, { roles }),

  getCurrentUser: () => reduxAction(securityActionTypes.GET_CURRENT_USER),
  getCurrentUserSuccess: user => reduxAction(securityActionTypes.GET_CURRENT_USER_SUCCESS, { user }),

  updatePassword: (email, password) => reduxAction(securityActionTypes.UPDATE_PASSWORD, { email, password }),
};

// --------------------------------------------------------------
// Module sagas
// function* actionSage(args) {
//   yield call; yield put({ type: actionType, payload: {} })
// }
// --------------------------------------------------------------

const securitySagaFunctions = {
  *loadAllRoles() {
    const { token } = yield select((state: RootState) => state.auth);
    const boxId = 'loadAllRoles';
    if (token) {
      // message.loading('loading all roles...');
      TimelineMessageBox.push({ key: boxId, type: 'loading', message: `loading all roles...` });
      try {
        const response = yield call(securityProxy.roles);
        // message.success('load all roles success!');
        TimelineMessageBox.push({ key: boxId, type: 'done', message: `load all roles success!` });
        logger.log('[loadAllRoles]', 'response of load all roles is', response);
        yield put(securityActions.loadAllRolesSuccess(response.data));
      } catch (e) {
        logger.warn('[loadAllRoles]', 'CATCH -> load all roles error', e);
        // message.error(toErrorMessage(e));
        TimelineMessageBox.push({ key: boxId, type: 'error', message: toErrorMessage(e) });
      }
    }
  },

  *getCurrentUser() {
    const { token } = yield select((state: RootState) => state.auth);
    const boxId = 'getCurrentUser';
    if (token) {
      // message.loading('loading current user...');
      TimelineMessageBox.push({ key: boxId, type: 'loading', message: `loading current user...` });
      try {
        logger.log('[getCurrentUser]', 'get current user after rehydrate...');
        const response = yield call(securityProxy.currentUser);
        // message.success('get current user success!');
        TimelineMessageBox.push({ key: boxId, type: 'done', message: `get current user success!` });
        logger.log('[getCurrentUser]', 'response of get current user is', response);
        yield put(securityActions.getCurrentUserSuccess(response.data));
      } catch (e) {
        logger.warn('[getCurrentUser]', 'CATCH -> get current user error', e);
        // message.error(toErrorMessage(e));
        TimelineMessageBox.push({ key: boxId, type: 'error', message: toErrorMessage(e) });
        yield put(authActions.logout());
      }
    }
  },
};

const securitySagas = [
  // takeLatest / takeEvery (actionType, actionSage)
  takeLatest(securityActionTypes.LOAD_ALL_ROLES, securitySagaFunctions.loadAllRoles),
  takeLatest(securityActionTypes.GET_CURRENT_USER, securitySagaFunctions.getCurrentUser),
];

// --------------------------------------------------------------
// Module reducers
// action = { payload: any? }
// --------------------------------------------------------------

const initialState = {};

const securityReducer = (previousState = initialState, action) => {
  if (isSecurityModule(action)) {
    return R.mergeDeepRight(previousState, action.payload);
  }
  return previousState;
};

export { securityActionTypes, securityActions, securitySagas, securityReducer, securitySagaFunctions };
