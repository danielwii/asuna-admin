import { all, call, put, select, takeLatest } from 'redux-saga/effects';

import { reduxAction } from 'node-buffs';
import _               from 'lodash';
import * as R          from 'ramda';

import { notificationsActions, notificationTypes } from '../store/notifications.redux';

import { modelsProxy }  from '../adapters/models';
import { createLogger } from '../adapters/logger';

const logger = createLogger('store:models');

// --------------------------------------------------------------
// Module actionTypes
// --------------------------------------------------------------

const actionTypes = {
  // ACTION: 'module::action'
  FETCH                   : 'models::fetch',
  FETCH_SUCCESS           : 'models::fetch-success',
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
  fetch       : (modelName, data) => reduxAction(actionTypes.FETCH, { modelName, data }),
  fetchSuccess: (modelName, response) => reduxAction(actionTypes.FETCH_SUCCESS, {
    modelName,
    response,
  }),

  upsert: (modelName, data) => reduxAction(actionTypes.UPSERT, { modelName, data }),

  loadAllSchemas       : () => reduxAction(actionTypes.LOAD_ALL_SCHEMAS),
  loadAllSchemasSuccess: schemas => reduxAction(actionTypes.LOAD_ALL_SCHEMAS_SUCCESS, { schemas }),
};

// --------------------------------------------------------------
// Module sagas
// function* actionSage(args) {
//   yield call; yield puy({ type: actionType, payload: {} })
// }
// --------------------------------------------------------------

function* fetch({ payload: { modelName, data } }) {
  const { token } = yield select(state => state.auth);
  if (token) {
    yield put(notificationsActions.notify(`fetch model '${modelName}'...`));
    try {
      const response = yield call(modelsProxy.fetch, { token }, modelName, data);
      yield put(notificationsActions.notify(`fetch model '${modelName}' success!`, notificationTypes.SUCCESS));
      logger.log('response of fetch model is', response);
      yield put(actions.fetchSuccess(modelName, response.data));
    } catch (e) {
      yield put(notificationsActions.notify(e, notificationTypes.ERROR));
      logger.warn('CATCH -> fetch model error', e);
    }
  }
}

function* upsert({ payload: { modelName, data } }) {
  const { token } = yield select(state => state.auth);
  if (token) {
    yield put(notificationsActions.notify(`upsert model '${modelName}'...`));
    try {
      const response = yield call(modelsProxy.upsert, { token }, modelName, data);
      yield put(notificationsActions.notify(`upsert model '${modelName}' success!`, notificationTypes.SUCCESS));
      logger.log('response of upsert model is', response);
      // save model data when upsert is success
      yield put(actions.fetchSuccess(modelName, response.data));
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
  takeLatest(actionTypes.FETCH, fetch),
];

// --------------------------------------------------------------
// Module reducers
// action = { payload: any? }
// --------------------------------------------------------------

const initialState = {};

const reducer = (previousState = initialState, action) => {
  if (isCurrent(action.type)) {
    switch (action.type) {
      case actionTypes.FETCH_SUCCESS: {
        const { modelName, response } = action.payload;

        const models = R.mergeDeepRight(previousState.models, {
          [modelName]: { [response.id]: response },
        });
        return { ...previousState, models };
      }
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
