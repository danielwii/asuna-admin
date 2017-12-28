// import { call, put, takeLatest } from 'redux-saga/effects';

// --------------------------------------------------------------
// Module actionTypes
// --------------------------------------------------------------

const actionTypes = {
  // ACTION: 'module::action'
};

// --------------------------------------------------------------
// Module actions
// --------------------------------------------------------------

const actionEvents = {
  // action: (args): ({ type, payload })
};

const actions = {
  // action: (args): dispatchFunction with actionEvent
};

// --------------------------------------------------------------
// Module sagas
// function* actionSage(args) {
//  yield call; yield puy({ type: actionType, payload: {} })
// }
// --------------------------------------------------------------

const sagas = [
  // takeLatest / takeEvery (actionType, actionSage)
];

// --------------------------------------------------------------
// Module reducers
// action = { payload: any? }
// --------------------------------------------------------------

const initialState = {};

const reducer = (previousState = initialState, action) => {
  switch (action.type) {
    default:
      return previousState;
    // return { ...state, ...action.payload };
  }
};

export {
  actionTypes as moduleActionTypes,
  actionEvents as moduleActionEvents,
  actions as moduleActions,
  sagas as moduleSagas,
  reducer as moduleReducer,
};

