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
    reduxAction(actionTypes.FETCH, { modelName, data }),
  fetchSuccess: (modelName, response) =>
    reduxAction(actionTypes.FETCH_SUCCESS, { modelName, response }),

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

// function* loadAssociations({ payload: { associationNames } }) {
//   const { token } = yield select(state => state.auth);
//   if (token) {
//     const effects     = modelsProxy.listAssociationsCallable({ token }, associationNames);
//     const allResponse = yield all(effects);
//
//     logger.log('allResponse is', allResponse);
//
//     // eslint-disable-next-line function-paren-newline
//     const associations = Object.assign(..._.map(
//       allResponse,
//       (response, name) => ({ [name]: response.data }),
//     ));
//     logger.log('associations is', associations);
//   }
// }

function* fetch({ payload: { modelName, data } }) {
  const { token } = yield select(state => state.auth);
  if (token) {
    message.loading(`loading model '${modelName}'...`);
    try {
      const response = yield call(modelsProxy.fetch, { token }, modelName, data);
      message.success(`load model '${modelName}' success!`);
      logger.log('response of load model is', response);
      yield put(actions.fetchSuccess(modelName, response.data));
    } catch (e) {
      message.error(e);
      logger.warn('CATCH -> load model error', e);
    }
  }
}

function* upsert({ payload: { modelName, data } }) {
  const { token }   = yield select(state => state.auth);
  const { schemas } = yield select(state => state.models);
  if (token) {
    message.info(`upsert model '${modelName}'...`);
    try {
      const response = yield call(modelsProxy.upsert, { token, schemas }, modelName, data);
      message.success(`upsert model '${modelName}' success!`);
      logger.log('response of upsert model is', response);
      // save model data when upsert is success
      yield put(actions.fetchSuccess(modelName, response.data));
    } catch (e) {
      message.error(e);
      logger.warn('CATCH -> upsert model error', e);
    }
  }
}

function* remove({ payload: { modelName, data } }) {
  const { token } = yield select(state => state.auth);
  if (token) {
    message.info(`remove model '${modelName}'...`);
    try {
      const response = yield call(modelsProxy.remove, { token }, modelName, data);
      message.success(`remove model '${modelName}' success!`);
      logger.log('response of remove model is', response);
      // save model data when remove is success
      yield put(actions.fetchSuccess(modelName, response.data));
    } catch (e) {
      message.error(e);
      logger.warn('CATCH -> remove model error', e);
    }
  }
}

function* loadAllSchemasSaga() {
  logger.log('load all options in saga');
  const { token } = yield select(state => state.auth);
  if (token) {
    message.loading('loading all options...');
    try {
      const effects     = modelsProxy.listSchemasCallable({ token });
      const allResponse = yield all(effects);

      logger.log('allResponse is', allResponse);

      const schemas = Object.assign(..._.map(
        allResponse,
        (response, name) => ({ [name]: response.data }),
      ));
      message.success('load all schemas success');
      yield put(actions.loadAllSchemasSuccess(schemas));
      logger.log('load all model schemas', effects, schemas);
    } catch (e) {
      message.error(e);
      logger.warn('CATCH -> load all options error occurred', e);
    }
  }
}

const sagas = [
  // takeLatest / takeEvery (actionType, actionSage)
  // takeLatest(actionTypes.LOAD_ASSOCIATIONS, loadAssociations),
  takeLatest(actionTypes.LOAD_ALL_SCHEMAS, loadAllSchemasSaga),
  takeLatest(actionTypes.REMOVE, remove),
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
      // case actionTypes.LOAD_ASSOCIATIONS_SUCCESS: {
      //   const { associationNames, response } = action.payload;
      //   return R.mergeDeepRight(previousState, {
      //     associations: {
      //       [associationName]: { [response.id]: response },
      //     },
      //   });
      // }
      case actionTypes.FETCH_SUCCESS: {
        const { modelName, response } = action.payload;
        return R.mergeDeepRight(previousState, {
          models: {
            [modelName]: { [response.id]: response },
          },
        });
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
