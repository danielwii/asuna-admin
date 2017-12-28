import PropTypes from 'prop-types';
import Router    from 'next/router';

import { takeLatest } from 'redux-saga/effects';

// --------------------------------------------------------------
// Module actionTypes
// --------------------------------------------------------------

const actionTypes = {
  // ACTION: 'module::action'
  TO_HOME: 'router::to_home',
};

const isCurrentModule = type => type.startsWith('router::');

// --------------------------------------------------------------
// Module actions
// --------------------------------------------------------------

const actionEvents = {
  // action: (args): ({ type, payload })
  toHome: () => ({ type: actionTypes.TO_HOME, payload: { path: '/home' } }),
};

const actions = {
  // action: (args): dispatchFunction with actionEvent
  toHome: () => dispatch => dispatch(actionEvents.toHome()),
};

// --------------------------------------------------------------
// Module sagas
// function* actionSage(args) {
//  yield call; yield puy({ type: actionType, payload: {} })
// }
// --------------------------------------------------------------

function goto({ payload: { path } }) {
  Router.replace(path);
}

const sagas = [
  // takeLatest / takeEvery (actionType, actionSage)
  takeLatest(actionTypes.TO_HOME, goto),
];

// --------------------------------------------------------------
// Module reducers
// action = { payload: any? }
// --------------------------------------------------------------

const initialState = {
  path: null,
};

const shape = PropTypes.shape({
  path: PropTypes.string,
});

const reducer = (previousState = initialState, action) => {
  if (isCurrentModule(action.type)) {
    switch (action.type) {
      default:
        return { ...action.payload };
    }
  } else {
    return previousState;
  }
};

export {
  actionTypes as routerActionTypes,
  actionEvents as routerActionEvents,
  actions as routerActions,
  sagas as routerSagas,
  reducer as routerReducer,
  shape as routerShape,
};

