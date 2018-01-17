import { call, put, select, takeLatest } from 'redux-saga/effects';

import { reduxAction } from 'node-buffs';

import { notificationsActions, notificationTypes } from '../store/notifications.redux';

import { modelsProxy } from '../adapters/models';

// --------------------------------------------------------------
// Module actionTypes
// --------------------------------------------------------------

const actionTypes = {
  // ACTION: 'module::action'
  CONTENT_LOAD_MODELS        : 'content::load-model',
  CONTENT_LOAD_MODELS_FAILED : 'content::load-model-failed',
  CONTENT_LOAD_MODELS_SUCCESS: 'content::load-model-success',
};

const isCurrent = type => type.startsWith('content::');

// --------------------------------------------------------------
// Module actions
// --------------------------------------------------------------

const actions = {
  // action: (args) => ({ type, payload })
  loadModels       : (name, data) => reduxAction(actionTypes.CONTENT_LOAD_MODELS, { name, data }),
  loadModelsSuccess: data => reduxAction(actionTypes.CONTENT_LOAD_MODELS_SUCCESS, { models: data }),
  // loadModelsFailed : error => reduxAction(actionTypes.CONTENT_LOAD_MODELS_FAILED, {}, error),
};

// --------------------------------------------------------------
// Module sagas
// function* actionSage(args) {
//   yield call; yield puy({ type: actionType, payload: {} })
// }
// --------------------------------------------------------------

function* loadModels({ payload: { name, data } }) {
  const { token } = yield select(state => state.auth);
  if (token) {
    yield put(notificationsActions.notify(`load content '${name}'...`));
    try {
      console.log('modelsProxy is', modelsProxy);
      const response = yield call(modelsProxy.loadModels, { token }, { name }, data);
      yield put(notificationsActions.notify(`load content '${name}' success`, notificationTypes.SUCCESS));
      yield put(actions.loadModelsSuccess({ [name]: { data: response.data } }));
      console.log('load content', name, response.data);
    } catch (e) {
      yield put(notificationsActions.notify(e, notificationTypes.ERROR));
      console.warn('CATCH ->', e);
    }
  }
}

const sagas = [
  // takeLatest / takeEvery (actionType, actionSage)
  takeLatest(actionTypes.CONTENT_LOAD_MODELS, loadModels),
];

// --------------------------------------------------------------
// Module reducers
// action = { payload: any? }
// --------------------------------------------------------------

const initialState = {};

const reducer = (previousState = initialState, action) => {
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
  actionTypes as contentActionTypes,
  actions as contentActions,
  sagas as contentSagas,
  reducer as contentReducer,
};
