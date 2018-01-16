import { all, put, select, takeLatest } from 'redux-saga/effects';

import { reduxAction } from 'node-buffs';
import _               from 'lodash';

import { notificationsActions, notificationTypes } from '../store/notifications.redux';

import { modelsProxy } from '../adapters/models';

// --------------------------------------------------------------
// Module actionTypes
// --------------------------------------------------------------

const actionTypes = {
  // ACTION: 'module::action'
  // LOAD_SCHEMA            : 'models::load-schema',
  // LOAD_SCHEMA_FAILED     : 'models::load-schema-failed',
  // LOAD_SCHEMA_SUCCESS    : 'models::load-schema-success',
  LOAD_ALL_SCHEMAS        : 'models::load-all-schemas',
  LOAD_ALL_SCHEMAS_FAILED : 'models::load-all-schemas-failed',
  LOAD_ALL_SCHEMAS_SUCCESS: 'models::load-all-schemas-success',
};

const isCurrent = type => type.startsWith('models::');

// --------------------------------------------------------------
// Module actions
// --------------------------------------------------------------

const actions = {
  // action: (args) => ({ type, payload })
  // loadSchema          : () => reduxAction(actionTypes.LOAD_SCHEMAS),
  // loadSchemaFailed    : error => reduxAction(actionTypes.LOAD_SCHEMAS_FAILED, {}, error),
  // loadSchemaSuccess   : options => reduxAction(actionTypes.LOAD_SCHEMAS_SUCCESS, { options }),
  loadAllSchemas       : () => reduxAction(actionTypes.LOAD_ALL_SCHEMAS),
  // loadAllSchemasFailed : error => reduxAction(actionTypes.LOAD_ALL_SCHEMAS_FAILED, {}, error),
  loadAllSchemasSuccess: schemas => reduxAction(actionTypes.LOAD_ALL_SCHEMAS_SUCCESS, { schemas }),
};

// --------------------------------------------------------------
// Module sagas
// function* actionSage(args) {
//   yield call; yield puy({ type: actionType, payload: {} })
// }
// --------------------------------------------------------------

function* loadAllSchemasSaga() {
  console.log('load all options in saga');
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
      console.log('load all model schemas', effects, schemas);
    } catch (e) {
      yield put(notificationsActions.notify(e, notificationTypes.ERROR));
      console.warn('CATCH -> load all options error occurred', e);
    }
  }
}

const sagas = [
  // takeLatest / takeEvery (actionType, actionSage)
  takeLatest(actionTypes.LOAD_ALL_SCHEMAS, loadAllSchemasSaga),
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
