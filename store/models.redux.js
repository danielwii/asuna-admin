import { all, put, select, takeLatest } from 'redux-saga/effects';

import _ from 'lodash';

import { notificationsActions, notificationTypes } from '../store/notifications.redux';

import { modelsProxy } from '../adapters/models';

// --------------------------------------------------------------
// Module actionTypes
// --------------------------------------------------------------

const actionTypes = {
  // ACTION: 'module::action'
  LOAD_OPTIONS            : 'models::load-options',
  LOAD_OPTIONS_FAILED     : 'models::load-options-failed',
  LOAD_OPTIONS_SUCCESS    : 'models::load-options-success',
  LOAD_ALL_OPTIONS        : 'models::load-all-options',
  LOAD_ALL_OPTIONS_FAILED : 'models::load-all-options-failed',
  LOAD_ALL_OPTIONS_SUCCESS: 'models::load-all-options-success',
};

const isCurrent = type => type.startsWith('models::');

// --------------------------------------------------------------
// Module actions
// --------------------------------------------------------------

const actions = {
  // action: (args): ({ type, payload })
  loadOptions          : () => ({ type: actionTypes.LOAD_OPTIONS, payload: {}, error: null }),
  loadOptionsSuccess   : options => ({
    type   : actionTypes.LOAD_OPTIONS_SUCCESS,
    payload: { options },
    error  : null,
  }),
  loadOptionsFailed    : error => ({ type: actionTypes.LOAD_OPTIONS_FAILED, payload: {}, error }),
  loadAllOptions       : () => ({ type: actionTypes.LOAD_ALL_OPTIONS, payload: {}, error: null }),
  loadAllOptionsSuccess: options => ({
    type   : actionTypes.LOAD_ALL_OPTIONS_SUCCESS,
    payload: { options },
    error  : null,
  }),
  loadAllOptionsFailed : error => ({
    type   : actionTypes.LOAD_ALL_OPTIONS_FAILED,
    payload: {},
    error,
  }),
};

// --------------------------------------------------------------
// Module sagas
// function* actionSage(args) {
//   yield call; yield puy({ type: actionType, payload: {} })
// }
// --------------------------------------------------------------

function* loadAllOptionsSaga() {
  console.log('load all options in saga');
  const { token } = yield select(state => state.auth);
  if (token) {
    yield put(notificationsActions.notify('load all options...'));
    try {
      const effects     = modelsProxy.loadAllOptions({ token });
      const allResponse = yield all(effects);

      const options = Object.assign(..._.map(
        allResponse,
        (response, name) => ({ [name]: response.data }),
      ));
      yield put(notificationsActions.notify('load all options success', notificationTypes.SUCCESS));
      yield put(actions.loadAllOptionsSuccess(options));
      console.log('load all model options', effects, options);
    } catch (e) {
      yield put(notificationsActions.notify(e, notificationTypes.ERROR));
      console.warn('CATCH -> load all options error occurred', e);
    }
  }
}

const sagas = [
  // takeLatest / takeEvery (actionType, actionSage)
  takeLatest(actionTypes.LOAD_ALL_OPTIONS, loadAllOptionsSaga),
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
