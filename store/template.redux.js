import PropTypes from 'prop-types';
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

const shape = PropTypes.shape({});

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
  actionEvents as moduleActionEvents,
  actions as moduleActions,
  sagas as moduleSagas,
  reducer as moduleReducer,
  shape as moduleShape,
};

