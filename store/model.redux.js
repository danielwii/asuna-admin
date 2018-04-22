import { all, call, put, select, takeLatest } from 'redux-saga/effects';

import { message }     from 'antd';
import { reduxAction } from 'node-buffs';
import * as R          from 'ramda';
import _               from 'lodash';

import { contentActions }   from './content.redux';
import { modelProxy }       from '../adapters/model';
import { createLogger, lv } from '../helpers';

const logger = createLogger('store:models', lv.warn);

// --------------------------------------------------------------
// Module actionTypes
// --------------------------------------------------------------

const modelsActionTypes = {
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

const modelsActions = {
  // action: (args) => ({ type, payload })
  fetch       : (modelName, data) =>
    reduxAction(modelsActionTypes.FETCH, {
      modelName,
      data,
      loading: { [modelName]: true }, // not using this moment
    }),
  fetchSuccess: (modelName, response) =>
    reduxAction(modelsActionTypes.FETCH_SUCCESS, {
      modelName,
      models : { [modelName]: { [response.id]: response } },
      loading: { [modelName]: false },
    }),

  upsert: (modelName, data, callback) => ({
    type   : modelsActionTypes.UPSERT,
    payload: { modelName, data },
    callback,
  }),
  // upsert: (modelName, data) => reduxAction(modelsActionTypes.UPSERT, { modelName, data }),
  remove: (modelName, data) => reduxAction(modelsActionTypes.REMOVE, { modelName, data }),

  loadAllSchemas       : () => reduxAction(modelsActionTypes.LOAD_ALL_SCHEMAS),
  loadAllSchemasSuccess: schemas =>
    reduxAction(modelsActionTypes.LOAD_ALL_SCHEMAS_SUCCESS, { schemas }),
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
        const response = yield call(modelProxy.fetch, { token }, modelName, data);
        message.success(`load model '${modelName}' success!`);
        logger.log('[fetch]', 'response of load model is', response);
        yield put(modelsActions.fetchSuccess(modelName, response.data));
      } catch (e) {
        logger.warn('[fetch]', e);
        message.error(e.message);
      }
    }
  },
  * upsert({ payload: { modelName, data }, callback }) {
    const { token }   = yield select(state => state.auth);
    const { schemas } = yield select(state => state.models);
    if (token) {
      message.info(`upsert model '${modelName}'...`);
      try {
        const response = yield call(modelProxy.upsert, { token, schemas }, modelName, data);
        message.success(`upsert model '${modelName}' success!`);
        logger.log('[upsert]', 'response of upsert model is', response);
        // save model data when upsert is success
        yield put(modelsActions.fetchSuccess(modelName, response.data));
        // refresh models in content index
        yield put(contentActions.loadModels(modelName));
        if (callback != null) callback(response);
      } catch (e) {
        logger.warn('[upsert]', { e, response: e.response });
        if (callback != null) callback(e.response);
        message.error(e.message);
      }
    }
  },
  * remove({ payload: { modelName, data } }) {
    const { token } = yield select(state => state.auth);
    if (token) {
      message.info(`remove model '${modelName}'...`);
      try {
        const response = yield call(modelProxy.remove, { token }, modelName, data);
        message.success(`remove model '${modelName}' success!`);
        logger.log('[remove]', 'response of remove model is', response);
        // save model data when remove is success
        yield put(modelsActions.fetchSuccess(modelName, response.data));
        // refresh models in content index
        yield put(contentActions.loadModels(modelName));
      } catch (e) {
        logger.warn('[remove]', e);
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
        const effects     = modelProxy.listSchemasCallable({ token });
        const allResponse = yield all(effects);

        logger.log('[loadAllSchemas]', 'allResponse is', allResponse);

        const schemas = Object.assign(..._.map(
          allResponse,
          (response, name) => ({ [name]: response.data }),
        ));
        message.success('load all schemas success');
        yield put(modelsActions.loadAllSchemasSuccess(schemas));
        logger.log('[loadAllSchemas]', 'load all model schemas', effects, schemas);
      } catch (e) {
        logger.warn('[loadAllSchemas]', e);
        message.error(e.message);
      }
    }
  },
};


const modelsSagas = [
  // takeLatest / takeEvery (actionType, actionSage)
  takeLatest(modelsActionTypes.LOAD_ALL_SCHEMAS, modelsSagaFunctions.loadAllSchemas),
  takeLatest(modelsActionTypes.REMOVE, modelsSagaFunctions.remove),
  takeLatest(modelsActionTypes.UPSERT, modelsSagaFunctions.upsert),
  takeLatest(modelsActionTypes.FETCH, modelsSagaFunctions.fetch),
];

// --------------------------------------------------------------
// Module reducers
// action = { payload: any? }
// --------------------------------------------------------------

const initialState = {};

const modelsCleaner = rootState => ({ ...rootState, models: initialState });

const modelsReducer = (previousState = initialState, action) => {
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
  modelsActionTypes,
  modelsActions,
  modelsSagas,
  modelsReducer,
  modelsCleaner,
  modelsSagaFunctions,
};
