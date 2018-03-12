import { all, call, put, select, takeLatest } from 'redux-saga/effects';

import { reduxAction } from 'node-buffs';
import * as R          from 'ramda';
import _               from 'lodash';

import { message }      from 'antd';
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
  REMOVE                  : 'models::remove',
  LOAD_ALL_SCHEMAS        : 'models::load-all-schemas',
  LOAD_ALL_SCHEMAS_SUCCESS: 'models::load-all-schemas-success',
};

const isCurrent = type => type.startsWith('models::');

// --------------------------------------------------------------
// Module actions
// --------------------------------------------------------------

const actions = {
  // action: (args) => ({ type, payload })
  fetch       : (modelName, data) =>
    reduxAction(actionTypes.FETCH, {
      modelName,
      data,
      loading: { [modelName]: true }, // not using this moment
    }),
  fetchSuccess: (modelName, response) =>
    reduxAction(actionTypes.FETCH_SUCCESS, {
      modelName,
      models : { [modelName]: { [response.id]: response } },
      loading: { [modelName]: false },
    }),

  upsert: (modelName, data) => reduxAction(actionTypes.UPSERT, { modelName, data }),
  remove: (modelName, data) => reduxAction(actionTypes.REMOVE, { modelName, data }),

  loadAllSchemas       : () => reduxAction(actionTypes.LOAD_ALL_SCHEMAS),
  loadAllSchemasSuccess: schemas => reduxAction(actionTypes.LOAD_ALL_SCHEMAS_SUCCESS, { schemas }),
};

// --------------------------------------------------------------
// Module sagas
// function* actionSage(args) {
//   yield call; yield puy({ type: actionType, payload: {} })
// }
// --------------------------------------------------------------

const modelsSagaFunctions = {
  * fetch({ payload: { modelName, data } }) {
    const { token } = yield select(state => state.auth);
    if (token) {
      message.loading(`loading model '${modelName}'...`);
      try {
        const response = yield call(modelsProxy.fetch, { token }, modelName, data);
        message.success(`load model '${modelName}' success!`);
        logger.log('[fetch]', 'response of load model is', response);
        yield put(actions.fetchSuccess(modelName, response.data));
      } catch (e) {
        logger.warn('[fetch]', 'CATCH -> load model error', e);
        message.error(e.message);
      }
    }
  },
  * upsert({ payload: { modelName, data } }) {
    const { token }   = yield select(state => state.auth);
    const { schemas } = yield select(state => state.models);
    if (token) {
      message.info(`upsert model '${modelName}'...`);
      try {
        const response = yield call(modelsProxy.upsert, { token, schemas }, modelName, data);
        message.success(`upsert model '${modelName}' success!`);
        logger.log('[upsert]', 'response of upsert model is', response);
        // save model data when upsert is success
        yield put(actions.fetchSuccess(modelName, response.data));
      } catch (e) {
        logger.warn('[upsert]', 'CATCH -> upsert model error', e);
        message.error(e.message);
      }
    }
  },
  * remove({ payload: { modelName, data } }) {
    const { token } = yield select(state => state.auth);
    if (token) {
      message.info(`remove model '${modelName}'...`);
      try {
        const response = yield call(modelsProxy.remove, { token }, modelName, data);
        message.success(`remove model '${modelName}' success!`);
        logger.log('[remove]', 'response of remove model is', response);
        // save model data when remove is success
        yield put(actions.fetchSuccess(modelName, response.data));
      } catch (e) {
        logger.warn('[remove]', 'CATCH -> remove model error', e);
        message.error(e.message);
      }
    }
  },
  * loadAllSchemas() {
    logger.log('[loadAllSchemas]', 'load all schemas in saga');
    const { token } = yield select(state => state.auth);
    if (token) {
      message.loading('loading all schemas...');
      try {
        const effects     = modelsProxy.listSchemasCallable({ token });
        const allResponse = yield all(effects);

        logger.log('[loadAllSchemas]', 'allResponse is', allResponse);

        const schemas = Object.assign(..._.map(
          allResponse,
          (response, name) => ({ [name]: response.data }),
        ));
        message.success('load all schemas success');
        yield put(actions.loadAllSchemasSuccess(schemas));
        logger.log('[loadAllSchemas]', 'load all model schemas', effects, schemas);
      } catch (e) {
        logger.warn('[loadAllSchemas]', 'CATCH -> load all schemas error occurred', e);
        message.error(e.message);
      }
    }
  },
};


const sagas = [
  // takeLatest / takeEvery (actionType, actionSage)
  takeLatest(actionTypes.LOAD_ALL_SCHEMAS, modelsSagaFunctions.loadAllSchemas),
  takeLatest(actionTypes.REMOVE, modelsSagaFunctions.remove),
  takeLatest(actionTypes.UPSERT, modelsSagaFunctions.upsert),
  takeLatest(actionTypes.FETCH, modelsSagaFunctions.fetch),
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
        return R.omit(['modelName', 'data'])(R.mergeDeepRight(previousState, action.payload));
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
  modelsSagaFunctions,
};
