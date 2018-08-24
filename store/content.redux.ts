import { call, put, select, takeLatest } from 'redux-saga/effects';

import * as R from 'ramda';
import { reduxAction } from 'node-buffs';
import { message } from 'antd';

import { ModelListConfig, modelProxy } from '../adapters/model';
import { createLogger } from '../helpers';

import { RootState } from '@asuna-admin/store';

const logger = createLogger('store:content', 'warn');

// --------------------------------------------------------------
// Module actionTypes
// --------------------------------------------------------------

const contentActionTypes = {
  // ACTION: 'module::action'
  CONTENT_LOAD_MODELS: 'content::load-models',
  CONTENT_LOAD_MODELS_FAILED: 'content::load-models-failed',
  CONTENT_LOAD_MODELS_SUCCESS: 'content::load-models-success',
};

export const isContentModule = action => action.type.startsWith('content::') && !action.transient;

// --------------------------------------------------------------
// Module actions
// --------------------------------------------------------------

interface LoadModelsParams extends SagaParams {
  payload: {
    name: string;
    models: {
      [key: string]: { extras: ModelListConfig; loading: true };
    };
  };
}

const contentActions = {
  // action: (args) => ({ type, payload })
  loadModels: (name: string, extras?: ModelListConfig) =>
    reduxAction(contentActionTypes.CONTENT_LOAD_MODELS, {
      name,
      models: { [name]: { extras, loading: true } },
    }),
  loadModelsSuccess: data =>
    reduxAction(contentActionTypes.CONTENT_LOAD_MODELS_SUCCESS, { models: data }),
  // loadModelsFailed : error => reduxAction(contentActionTypes.CONTENT_LOAD_MODELS_FAILED, {},
  // error),
};

// --------------------------------------------------------------
// Module sagas
// function* actionSage(args) {
//   yield call; yield puy({ type: actionType, payload: {} })
// }
// --------------------------------------------------------------

function* loadModels({ payload: { name, models } }: LoadModelsParams) {
  const { token } = yield select<RootState>(state => state.auth);
  if (token) {
    try {
      const {
        [name]: { extras },
      } = models;
      logger.debug('[loadModels]', 'loading content', { name, extras });
      message.loading(`loading content '${name}'...`);

      const response = yield call(modelProxy.loadModels, { token }, name, extras);
      message.success(`load content '${name}' success`);
      logger.log('[loadModels]', 'loaded content', { name, response });

      yield put(
        contentActions.loadModelsSuccess({
          [name]: { data: response.data, loading: false },
        }),
      );
    } catch (e) {
      logger.warn('[loadModels]', { e });
      message.error(e.message);
    }
  }
}

const contentSagas = [
  // takeLatest / takeEvery (actionType, actionSage)
  takeLatest(contentActionTypes.CONTENT_LOAD_MODELS as any, loadModels),
];

// --------------------------------------------------------------
// Module reducers
// action = { payload: any? }
// --------------------------------------------------------------

const initialState = {};

const contentReducer = (previousState = initialState, action) => {
  if (isContentModule(action)) {
    return R.mergeDeepRight(previousState, action.payload);
  }
  return previousState;
};

export { contentActionTypes, contentActions, contentSagas, contentReducer };
