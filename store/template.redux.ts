// import { call, put, takeLatest } from 'redux-saga/effects';

// --------------------------------------------------------------
// Module actionTypes
// --------------------------------------------------------------

const actionTypes = {
  // ACTION: 'module::action'
};

const isAvailable = action => action.type.startsWith(/* module:: */) && !action.transient;


// --------------------------------------------------------------
// Module actions
// --------------------------------------------------------------

const actions = {
  // action: (args) => ({ type, payload })
};

// --------------------------------------------------------------
// Sagas by redux-saga
// function* actionSage(args) {
//   yield call; yield put({ type: actionType, payload: {} })
// }
// --------------------------------------------------------------

const sagas = [
  // takeLatest / takeEvery (actionType, actionSage)
];

// --------------------------------------------------------------
// Epics by redux-observable
// --------------------------------------------------------------

const epics = [
  // action$ => action$.ofType(ACTION)
];

// --------------------------------------------------------------
// Module reducers
// action = { payload: any? }
// --------------------------------------------------------------

const initialState = {};

const reducer = (previousState = initialState, action) => {
  if (isAvailable(action)) {
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
  epics as moduleEpics,
  reducer as moduleReducer,
};
