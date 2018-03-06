import { call, put, select, takeLatest } from 'redux-saga/effects';

import * as R          from 'ramda';
import { reduxAction } from 'node-buffs';
import { message }     from 'antd';

import { modelsProxy }  from '../adapters/models';
import { createLogger } from '../adapters/logger';

const logger = createLogger('store:content');

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
  loadModels       : (name, data) => reduxAction(contentActionTypes.CONTENT_LOAD_MODELS, {
    name,
    models: { [name]: { data, loading: true } },
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

function* loadModels({ payload: { name, data } }) {
  const { token } = yield select(state => state.auth);
  if (token) {
    logger.info('loading content', name, data);
    message.loading(`loading content '${name}'...`);
    try {
      const response = yield call(modelsProxy.loadModels, { token }, name, data);
      message.success(`load content '${name}' success`);
      yield put(contentActions.loadModelsSuccess({
        [name]: { data: response.data, loading: false },
      }));
      logger.log('loaded content', name, response.data);
    } catch (e) {
      message.error(e);
      logger.warn('CATCH ->', e);
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
      case contentActionTypes.CONTENT_LOAD_MODELS_SUCCESS:
        return R.mergeDeepRight(previousState, action.payload);
      default:
        return { ...previousState, ...action.payload };
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
