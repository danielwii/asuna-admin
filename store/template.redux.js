// import { call, put, takeLatest } from 'redux-saga/effects';

// --------------------------------------------------------------
// Module actionTypes
// --------------------------------------------------------------

const actionTypes = {
  // ACTION: 'module::action'
};

const isCurrentModule = type => type.startsWith(/* module:: */);

// --------------------------------------------------------------
// Module actions
// --------------------------------------------------------------

const actions = {
  // action: (args): ({ type, payload })
};

// --------------------------------------------------------------
// Module sagas
// function* actionSage(args) {
//   yield call; yield puy({ type: actionType, payload: {} })
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
  if (isCurrentModule(action.type)) {
    switch (action.type) {
      default:
        return { ...previousState, ...action.payload };
    }
  } else {
    return previousState;
  }
};

export {
  actionTypes as moduleActionTypes,
  actions as moduleActions,
  sagas as moduleSagas,
  reducer as moduleReducer,
};
