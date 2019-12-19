import { ModelListConfig } from '@asuna-admin/adapters';
import { AppContext } from '@asuna-admin/core';
import { parseResponseError, TimelineMessageBox } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';
import { RootState } from '@asuna-admin/store';

import { reduxAction } from 'node-buffs';
import { call, put, select, takeLatest } from 'redux-saga/effects';

const logger = createLogger('store:content');

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
  loadModelsSuccess: data => reduxAction(contentActionTypes.CONTENT_LOAD_MODELS_SUCCESS, { models: data }),
  // loadModelsFailed : error => reduxAction(contentActionTypes.CONTENT_LOAD_MODELS_FAILED, {}, error),
};

// --------------------------------------------------------------
// Module sagas
// function* actionSage(args) {
//   yield call; yield puy({ type: actionType, payload: {} })
// }
// --------------------------------------------------------------

function* loadModels({ payload: { name, models } }: LoadModelsParams) {
  const { token } = yield select((state: RootState) => state.auth);
  const boxId = 'loadModels';
  if (token) {
    try {
      const {
        [name]: { extras },
      } = models;
      logger.debug('[loadModels]', 'loading content', { name, extras });
      // message.loading(`loading content '${name}'...`);
      TimelineMessageBox.push({ key: boxId, type: 'loading', message: `loading content '${name}'...` });

      const response = yield call(AppContext.adapters.models.loadModels, name, extras);
      // message.success(`load content '${name}' success`);
      TimelineMessageBox.push({ key: boxId, type: 'done', message: `load content '${name}' success` });
      logger.log('[loadModels]', 'loaded content', { name, response });

      yield put(contentActions.loadModelsSuccess({ [name]: { data: response.data, loading: false, extras } }));
    } catch (e) {
      logger.warn('[loadModels]', { e });
      // message.error(toErrorMessage(e));
      TimelineMessageBox.push({ key: boxId, type: 'error', message: parseResponseError(e) });
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

export interface ContentState {
  name?: string;
  models?: { [key: string]: { extras: ModelListConfig; loading: true } };
}

const initialState: ContentState = {};

const contentReducer = (previousState = initialState, action) => {
  if (isContentModule(action)) {
    return {
      name: action.payload.name,
      models: { ...previousState.models, ...action.payload.models },
    };
    // return R.mergeDeepRight(previousState, action.payload); // FIXME mergeDeepRight won't delete unused properties in object
  }
  return previousState;
};

export { contentActionTypes, contentActions, contentSagas, contentReducer };
