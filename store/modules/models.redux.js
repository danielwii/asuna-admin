import { call, put, select, takeLatest } from 'redux-saga/effects';

import { modelsApi } from '../../services/models';

import { notificationsActions, notificationTypes } from '../notifications.redux';

// --------------------------------------------------------------
// Module actionTypes
// --------------------------------------------------------------

const actionTypes = {
  // ACTION: 'module::action'
  SAVE   : 'mod::models::save',
  REFRESH: 'mod::models::refresh',
};

const isCurrentModule = type => type.startsWith('mod::models');

// --------------------------------------------------------------
// Module actions
// --------------------------------------------------------------

const actions = {
  // action: (args): ({ type, payload })
  save   : name => ({ type: actionTypes.SAVE, payload: { name } }),
  refresh: pageable => ({ type: actionTypes.REFRESH, payload: { pageable } }),
};

// --------------------------------------------------------------
// Module sagas
// function* actionSage(args) {
//  yield call; yield puy({ type: actionType, payload: {} })
// }
// --------------------------------------------------------------

function* save({ payload: { name } }) {
  const { token } = yield select(state => state.auth);
  if (token) {
    yield put(notificationsActions.notify(`save model '${name}'...`));
    try {
      const response = yield call(modelsApi.save, { token }, { name });
      yield put(notificationsActions.notify(`save model '${name}' success`, notificationTypes.SUCCESS));
      console.log('saved model is', response, response.data);
    } catch (e) {
      yield put(notificationsActions.notify(e, notificationTypes.ERROR));
      console.warn('CATCH -> save model error occurred', e.response, e);
    }
  }
}

function* refresh(pageable) {
  const { token } = yield select(state => state.auth);
  if (token) {
    console.log('refresh model');
    try {
      yield modelsApi.refresh({ token }, pageable);
    } catch (e) {
      console.warn(e);
    }
  }
}

const sagas = [
  // takeLatest / takeEvery (actionType, actionSage)
  takeLatest(actionTypes.SAVE, save),
  takeLatest(actionTypes.REFRESH, refresh),
];

// --------------------------------------------------------------
// Module reducers
// action = { payload: any? }
// --------------------------------------------------------------

const initialState = {};

const reducer = (previousState = initialState, action) => {
  if (isCurrentModule(action.type)) {
    switch (action.type) {
      case actionTypes.SAVE:
        return previousState; // do not have to persist model name in store
      default:
        return { ...previousState, ...action.payload };
    }
  } else {
    return previousState;
  }
};

export {
  actionTypes as modModelsActionTypes,
  actions as modModelsActions,
  sagas as modModelsSagas,
  reducer as modModelsReducer,
};
