import { call, put, select, takeLatest } from 'redux-saga/effects';

import * as R          from 'ramda';
import { reduxAction } from 'node-buffs';
import { message }     from 'antd';

import { modelsProxy }      from '../adapters/models';
import { createLogger, lv } from '../helpers/index';

const logger = createLogger('store:content', lv.warn);

// --------------------------------------------------------------
// Module actionTypes
// --------------------------------------------------------------

const contentActionTypes = {
  // ACTION: 'module::action'
  CONTENT_LOAD_MODELS        : 'content::load-models',
  CONTENT_LOAD_MODELS_FAILED : 'content::load-models-failed',
  CONTENT_LOAD_MODELS_SUCCESS: 'content::load-models-success',
};

const isCurrent = type => type.startsWith('content::');

// --------------------------------------------------------------
// Module actions
// --------------------------------------------------------------

const contentActions = {
  // action: (args) => ({ type, payload })
  loadModels       : (name, extras) => reduxAction(contentActionTypes.CONTENT_LOAD_MODELS, {
    name,
    models: { [name]: { extras, loading: true } },
  }),
  loadModelsSuccess: data => reduxAction(contentActionTypes.CONTENT_LOAD_MODELS_SUCCESS, {
    models: data,
  }),
  // loadModelsFailed : error => reduxAction(contentActionTypes.CONTENT_LOAD_MODELS_FAILED, {},
  // error),
};

// --------------------------------------------------------------
// Module sagas
// function* actionSage(args) {
//   yield call; yield puy({ type: actionType, payload: {} })
// }
// --------------------------------------------------------------

function* loadModels({ payload: { name, models } }) {
  const { token } = yield select(state => state.auth);
  if (token) {
    try {
      const { [name]: { extras } } = models;
      logger.info('[loadModels]', 'loading content', { name, extras });
      message.loading(`loading content '${name}'...`);

      const response = yield call(modelsProxy.loadModels, { token }, name, extras);
      message.success(`load content '${name}' success`);
      logger.log('[loadModels]', 'loaded content', { name, response });

      yield put(contentActions.loadModelsSuccess({
        [name]: { data: response.data, loading: false },
      }));
    } catch (e) {
      logger.warn('[loadModels]', 'CATCH ->', e);
      message.error(e.message);
    }
  }
}

const contentSagas = [
  // takeLatest / takeEvery (actionType, actionSage)
  takeLatest(contentActionTypes.CONTENT_LOAD_MODELS, loadModels),
];

// --------------------------------------------------------------
// Module reducers
// action = { payload: any? }
// --------------------------------------------------------------

const initialState = {};

const contentReducer = (previousState = initialState, action) => {
  if (isCurrent(action.type)) {
    switch (action.type) {
      default:
        // TODO update others to use mergeDeepRight
        return R.mergeDeepRight(previousState, action.payload);
    }
  } else {
    return previousState;
  }
};

export {
  contentActionTypes,
  contentActions,
  contentSagas,
  contentReducer,
};
