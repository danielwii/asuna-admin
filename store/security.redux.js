import { call, put, select, takeLatest } from 'redux-saga/effects';

import { reduxAction } from 'node-buffs';
import { message }     from 'antd';

import { securityProxy } from '../adapters/security';
import { createLogger }  from '../adapters/logger';
import { authActions }   from './auth.redux';

const logger = createLogger('store:security');

// --------------------------------------------------------------
// Module actionTypes
// --------------------------------------------------------------

const securityActionTypes = {
  // ACTION: 'security::action'
  LOAD_ALL_ROLES        : 'security::load-all-roles',
  LOAD_ALL_ROLES_SUCCESS: 'security::load-all-roles-success',

  GET_CURRENT_USER        : 'security::get-current-user',
  GET_CURRENT_USER_SUCCESS: 'security::get-current-user-success',

  UPDATE_PASSWORD: 'security::update-password',
};

const isCurrent = type => type.startsWith('security::');

// --------------------------------------------------------------
// Module actions
// --------------------------------------------------------------

const securityActions = {
  // action: (args) => ({ type, payload })
  loadAllRoles       : () => reduxAction(securityActionTypes.LOAD_ALL_ROLES),
  loadAllRolesSuccess: roles =>
    reduxAction(securityActionTypes.LOAD_ALL_ROLES_SUCCESS, { roles }),

  getCurrentUser       : () => reduxAction(securityActionTypes.GET_CURRENT_USER),
  getCurrentUserSuccess: user =>
    reduxAction(securityActionTypes.GET_CURRENT_USER_SUCCESS, { user }),

  updatePassword: (email, password) =>
    reduxAction(securityActionTypes.UPDATE_PASSWORD, { email, password }),
};

// --------------------------------------------------------------
// Module sagas
// function* actionSage(args) {
//   yield call; yield put({ type: actionType, payload: {} })
// }
// --------------------------------------------------------------

const securitySagaFunctions = {
  * loadAllRoles() {
    const { token } = yield select(state => state.auth);
    if (token) {
      message.loading('loading all roles...');
      try {
        const response = yield call(securityProxy.roles, { opts: { token } });
        message.success('load all roles success!');
        logger.log('[loadAllRoles]', 'response of load all roles is', response);
        yield put(securityActions.loadAllRolesSuccess(response.data));
      } catch (e) {
        logger.warn('[loadAllRoles]', 'CATCH -> load all roles error', e);
        message.error(e.message);
      }
    }
  },

  * getCurrentUser() {
    const { token } = yield select(state => state.auth);
    if (token) {
      message.loading('loading current user...');
      try {
        logger.log('[getCurrentUser]', 'get current user after rehydrate...');
        const response = yield call(securityProxy.currentUser, { opts: { token } });
        message.success('get current user success!');
        logger.log('[getCurrentUser]', 'response of get current user is', response);
        yield put(securityActions.getCurrentUserSuccess(response.data));
      } catch (e) {
        logger.warn('[getCurrentUser]', 'CATCH -> get current user error', e);
        message.error(e.message);
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
  if (isCurrent(action.type)) {
    switch (action.type) {
      default:
        return { ...previousState, ...action.payload };
    }
  } else {
    return previousState;
  }
};

export {
  securityActionTypes,
  securityActions,
  securitySagas,
  securityReducer,
  securitySagaFunctions,
};
