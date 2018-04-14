import { call, put, select, takeLatest } from 'redux-saga/effects';

import { modelsApi }    from '../../services/models';
import { createLogger } from '../../helpers/index';

import { notificationsActions, notificationTypes } from '../notifications.redux';

const logger = createLogger('store:modules:models');

// --------------------------------------------------------------
// Module actionTypes
// --------------------------------------------------------------

const actionTypes = {
  // ACTION: 'module::action'
  SAVE                  : 'mod::models::save',
  REFRESH_MODELS        : 'mod::models::refresh-models',
  REFRESH_MODELS_SUCCESS: 'mod::models::refresh-models-success',
};

const isCurrent = type => type.startsWith('mod::models');

// --------------------------------------------------------------
// Module actions
// --------------------------------------------------------------

const actions = {
  // action: (args) => ({ type, payload })
  save                : name => ({ type: actionTypes.SAVE, payload: { name } }),
  refreshModels       : pageable => ({ type: actionTypes.REFRESH_MODELS, payload: { pageable } }),
  refreshModelsSuccess: models => ({
    type   : actionTypes.REFRESH_MODELS_SUCCESS,
    payload: { models },
  }),
};

// --------------------------------------------------------------
// Module sagas
// function* actionSage(args) {
//   yield call; yield puy({ type: actionType, payload: {} })
// }
// --------------------------------------------------------------

function* save({ payload: { name } }) {
  const { token } = yield select(state => state.auth);
  if (token) {
    yield put(notificationsActions.notify(`save model '${name}'...`));
    try {
      const response = yield call(modelsApi.save, { token }, { name });
      yield put(notificationsActions.notify(`save model '${name}' success`, notificationTypes.SUCCESS));
      yield put(actions.refreshModels());
      logger.log('saved model is', response, response.data);
    } catch (e) {
      yield put(notificationsActions.notify(e, notificationTypes.ERROR));
      logger.warn('CATCH -> save model error occurred', e.response, e);
    }
  }
}

function* refreshModels() {
  const { token }    = yield select(state => state.auth);
  const { pageable } = yield select(state => state.mod_models);
  if (token) {
    logger.log('--> refreshModels model', pageable);
    yield put(notificationsActions.notify('loading models...'));
    try {
      const response = yield call(modelsApi.refreshModels, { token }, pageable);

      const { data, data: { totalElements } } = response;
      yield put(actions.refreshModelsSuccess(data));
      yield put(notificationsActions.notify(`loading models success, ${totalElements} in total.`, notificationTypes.SUCCESS));
      logger.log('models is', response, response.data);
    } catch (e) {
      yield put(notificationsActions.notify(e, notificationTypes.ERROR));
      logger.warn('loading models', e);
    }
  }
}

const sagas = [
  // takeLatest / takeEvery (actionType, actionSage)
  takeLatest(actionTypes.SAVE, save),
  takeLatest(actionTypes.REFRESH_MODELS, refreshModels),
];

// --------------------------------------------------------------
// Module reducers
// action = { payload: any? }
// --------------------------------------------------------------

const initialState = {
  models: null,
};

const reducer = (previousState = initialState, action) => {
  if (isCurrent(action.type)) {
    switch (action.type) {
      case actionTypes.SAVE:
        return previousState; // do not have to persist model name in store
      default:
        return { ...previousState, ...action.payload };
    }
  } else {
    return previousState;
  }
};

export {
  actionTypes as modModelsActionTypes,
  actions as modModelsActions,
  sagas as modModelsSagas,
  reducer as modModelsReducer,
};
