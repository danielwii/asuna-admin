import { all, call, put, select, takeLatest } from 'redux-saga/effects';

import { reduxAction } from 'node-buffs';
import _               from 'lodash';

import { notificationsActions, notificationTypes } from '../store/notifications.redux';

import { modelsProxy } from '../adapters/models';
import { logger }      from '../adapters/logger';

// --------------------------------------------------------------
// Module actionTypes
// --------------------------------------------------------------

const actionTypes = {
  // ACTION: 'module::action'
  UPSERT                  : 'models::upsert',
  LOAD_ALL_SCHEMAS        : 'models::load-all-schemas',
  LOAD_ALL_SCHEMAS_SUCCESS: 'models::load-all-schemas-success',
};

const isCurrent = type => type.startsWith('models::');

// --------------------------------------------------------------
// Module actions
// --------------------------------------------------------------

const actions = {
  // action: (args) => ({ type, payload })
  upsert: (model, data) => reduxAction(actionTypes.UPSERT, { model, data }),

  loadAllSchemas       : () => reduxAction(actionTypes.LOAD_ALL_SCHEMAS),
  loadAllSchemasSuccess: schemas => reduxAction(actionTypes.LOAD_ALL_SCHEMAS_SUCCESS, { schemas }),

};

// --------------------------------------------------------------
// Module sagas
// function* actionSage(args) {
//   yield call; yield puy({ type: actionType, payload: {} })
// }
// --------------------------------------------------------------

function* upsert({ payload: { model, data } }) {
  const { token } = yield select(state => state.auth);
  if (token) {
    yield put(notificationsActions.notify(`upsert model '${model}'...`));
    try {
      const response = yield call(modelsProxy.upsert, { token }, model, data);
      yield put(notificationsActions.notify(`upsert model '${model}' success!`, notificationTypes.SUCCESS));
      logger.log('response of upsert model is', response);
    } catch (e) {
      yield put(notificationsActions.notify(e, notificationTypes.ERROR));
      logger.warn('CATCH -> upsert model error', e);
    }
  }
}

function* loadAllSchemasSaga() {
  logger.log('load all options in saga');
  const { token } = yield select(state => state.auth);
  if (token) {
    yield put(notificationsActions.notify('load all options...'));
    try {
      const effects     = modelsProxy.loadAllSchemas({ token });
      const allResponse = yield all(effects);

      const schemas = Object.assign(..._.map(
        allResponse,
        (response, name) => ({ [name]: response.data }),
      ));
      yield put(notificationsActions.notify('load all schemas success', notificationTypes.SUCCESS));
      yield put(actions.loadAllSchemasSuccess(schemas));
      logger.log('load all model schemas', effects, schemas);
    } catch (e) {
      yield put(notificationsActions.notify(e, notificationTypes.ERROR));
      logger.warn('CATCH -> load all options error occurred', e);
    }
  }
}

const sagas = [
  // takeLatest / takeEvery (actionType, actionSage)
  takeLatest(actionTypes.LOAD_ALL_SCHEMAS, loadAllSchemasSaga),
  takeLatest(actionTypes.UPSERT, upsert),
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
  actionTypes as modelsActionTypes,
  actions as modelsActions,
  sagas as modelsSagas,
  reducer as modelsReducer,
};
