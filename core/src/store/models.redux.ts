import { AppContext } from '@asuna-admin/core';
import { ReduxCallback, safeCallback, TimelineMessageBox, toErrorMessage } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';
import { contentActions, RootState } from '@asuna-admin/store';
import { Asuna } from '@asuna-admin/types';
import { AxiosResponse } from 'axios';
import _ from 'lodash';
import { reduxAction } from 'node-buffs';
import * as R from 'ramda';
import { call, put, select, takeLatest } from 'redux-saga/effects';

const logger = createLogger('store:models');

// --------------------------------------------------------------
// Module actionTypes
// --------------------------------------------------------------

const modelsActionTypes = {
  // ACTION: 'module::action'
  FETCH: 'models::fetch',
  FETCH_SUCCESS: 'models::fetch-success',
  UPSERT: 'models::upsert',
  REMOVE: 'models::remove',
  LOAD_ALL_SCHEMAS: 'models::load-all-schemas',
  LOAD_ALL_SCHEMAS_SUCCESS: 'models::load-all-schemas-success',
};

export const isModelModule = action => action.type.startsWith('models::') && !action.transient;

// --------------------------------------------------------------
// Module actions
// --------------------------------------------------------------

const modelsActions = {
  // action: (args) => ({ type, payload })
  fetch: (
    modelName: string,
    data: { id: number | string; profile: Asuna.Profile },
    callback?: ReduxCallback<AxiosResponse>,
  ) => ({
    type: modelsActionTypes.FETCH,
    payload: {
      modelName,
      data,
      loading: { [modelName]: true }, // not using this moment
    },
    callback,
  }),
  fetchSuccess: (modelName: string, response) =>
    reduxAction(modelsActionTypes.FETCH_SUCCESS, {
      modelName,
      models: { [modelName]: { [response.id]: response } },
      loading: { [modelName]: false },
    }),

  upsert: (modelName: string, data: object, callback: (response) => void) => ({
    type: modelsActionTypes.UPSERT,
    payload: { modelName, data },
    callback,
  }),
  // upsert: (modelName, data) => reduxAction(modelsActionTypes.UPSERT, { modelName, data }),
  remove: (modelName: string, data: object, callback?: (response) => void) => ({
    type: modelsActionTypes.REMOVE,
    payload: { modelName, data },
    callback,
  }),

  loadAllSchemas: () => reduxAction(modelsActionTypes.LOAD_ALL_SCHEMAS),
  loadAllSchemasSuccess: schemas => reduxAction(modelsActionTypes.LOAD_ALL_SCHEMAS_SUCCESS, { schemas }),
};

// --------------------------------------------------------------
// Module sagas
// function* actionSage(args) {
//   yield call; yield puy({ type: actionType, payload: {} })
// }
// --------------------------------------------------------------

const modelsSagaFunctions = {
  *fetch({ payload: { modelName, data }, callback }) {
    const { token } = yield select((state: RootState) => state.auth);
    const boxId = 'fetch';
    if (token) {
      TimelineMessageBox.push({ key: boxId, type: 'loading', message: `loading model '${modelName}'...` });
      try {
        const response = yield call(AppContext.adapters.models.fetch, modelName, data);
        TimelineMessageBox.push({ key: boxId, type: 'done', message: `load model '${modelName}' success` });
        logger.log('[fetch]', 'response of load model is', response);
        safeCallback(callback, { response });

        yield put(modelsActions.fetchSuccess(modelName, response.data));
      } catch (e) {
        logger.warn('[fetch]', e, { e });
        safeCallback(callback, { error: e });
        TimelineMessageBox.push({ key: boxId, type: 'error', message: toErrorMessage(e) });
      }
    }
  },
  /**
   * refresh models after model upsert in event bus
   */
  *upsert({ payload: { modelName, data }, callback }) {
    const { token } = yield select((state: RootState) => state.auth);
    const boxId = 'upsert';
    if (token) {
      TimelineMessageBox.push({ key: boxId, type: 'loading', message: `upsert model '${modelName}'...` });
      try {
        const response = yield call(AppContext.adapters.models.upsert, modelName, data);
        TimelineMessageBox.push({ key: boxId, type: 'done', message: `upsert model '${modelName}' success` });
        logger.log('[upsert]', 'response of upsert model is', response);
        if (callback != null) callback({ response });

        // save model data when upsert is success
        yield put(modelsActions.fetchSuccess(modelName, response.data));
      } catch (error) {
        logger.warn('[upsert]', error, { error });
        try {
          if (callback != null) callback({ error });
        } catch (e) {
          logger.warn('[upsert] callback error', e, { e });
        }
        TimelineMessageBox.push({ key: boxId, type: 'error', message: toErrorMessage(error) });
      }
    }
  },
  *remove({ payload: { modelName, data }, callback }) {
    const { token } = yield select((state: RootState) => state.auth);
    const boxId = 'remove';
    if (token) {
      TimelineMessageBox.push({ key: boxId, type: 'loading', message: `remove model '${modelName}'...` });
      try {
        const response = yield call(AppContext.adapters.models.remove, modelName, data);
        TimelineMessageBox.push({ key: boxId, type: 'done', message: `remove model '${modelName}' success` });
        logger.log('[remove]', 'response of remove model is', response);
        if (callback != null) callback(response);

        // save model data when remove is success
        yield put(modelsActions.fetchSuccess(modelName, response.data));
        // refresh models in content index
        const { models } = yield select((state: RootState) => state.content);
        yield put(contentActions.loadModels(modelName, _.get(models, `${modelName}.extras`)));
      } catch (error) {
        logger.warn('[remove]', error, { error });
        try {
          if (callback != null) callback({ error });
        } catch (e) {
          logger.warn('[upsert] callback error', e, { e });
        }
        TimelineMessageBox.push({ key: boxId, type: 'error', message: toErrorMessage(error) });
      }
    }
  },
  *loadAllSchemas() {
    logger.log('[loadAllSchemas]', 'load all schemas in saga');
    const { token } = yield select((state: RootState) => state.auth);
    const boxId = 'loadAllSchemas';
    if (token) {
      TimelineMessageBox.push({ key: boxId, type: 'loading', message: `loading all schemas...` });
      try {
        const schemas = yield AppContext.ctx.models.loadSchemas();

        TimelineMessageBox.push({ key: boxId, type: 'done', message: `load all schemas success!` });
        yield put(modelsActions.loadAllSchemasSuccess(schemas));
        logger.log('[loadAllSchemas]', 'load all model schemas', schemas);
      } catch (e) {
        logger.warn('[loadAllSchemas]', e, { e });
        TimelineMessageBox.push({ key: boxId, type: 'error', message: toErrorMessage(e) });
      }
    }
  },
};

const modelsSagas = [
  // takeLatest / takeEvery (actionType, actionSage)
  takeLatest(modelsActionTypes.LOAD_ALL_SCHEMAS, modelsSagaFunctions.loadAllSchemas),
  takeLatest(modelsActionTypes.REMOVE as any, modelsSagaFunctions.remove),
  takeLatest(modelsActionTypes.UPSERT as any, modelsSagaFunctions.upsert),
  takeLatest(modelsActionTypes.FETCH as any, modelsSagaFunctions.fetch),
];

// --------------------------------------------------------------
// Module reducers
// action = { payload: any? }
// --------------------------------------------------------------

export interface ModelsState {
  modelName?: string;
  data?: object;
  models?: { [key: string]: object };
  loading?: { [key: string]: boolean };
  schemas?: { [key: string]: Asuna.Schema.ModelSchema[] };
}

const initialState: ModelsState = {};

const modelsCleaner = rootState => ({ ...rootState, models: initialState });

const modelsReducer = (previousState = initialState, action) => {
  if (isModelModule(action)) {
    return R.mergeDeepRight(previousState, action.payload);
  }
  return previousState;
};

export { modelsActionTypes, modelsActions, modelsSagas, modelsReducer, modelsCleaner, modelsSagaFunctions };
