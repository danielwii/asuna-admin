import PropTypes from 'prop-types';
// import { call, put, takeLatest } from 'redux-saga/effects';

// --------------------------------------------------------------
// Notifications actionTypes
// --------------------------------------------------------------

const actionTypes = {
  // ACTION: 'module::action'
  NOTIFY     : 'notifications::notify',
  NOTIFY_DONE: 'notifications::notify_done',
};

// --------------------------------------------------------------
// Notifications actions
// --------------------------------------------------------------

const actionEvents = {
  notify    : message => ({ type: actionTypes.NOTIFY, payload: { message } }),
  notifyDone: () => ({ type: actionTypes.NOTIFY_DONE }),
};

const actions = {
  // action: (args): dispatchFunction
  notify    : message => dispatch => dispatch(actionEvents.notify(message)),
  notifyDone: () => dispatch => dispatch(actionEvents.notifyDone()),
};

// --------------------------------------------------------------
// Notifications sagas
//  function* actionSage(args) {
//  yield call; yield puy({ type: actionType, payload: {} })
// }
// --------------------------------------------------------------

const sagas = [
  // takeLatest / takeEvery (actionType, actionSage)
];

// --------------------------------------------------------------
// Notifications reducers
// action = { payload: any? }
// --------------------------------------------------------------

const initialState = {};

const shape = PropTypes.shape({
  message: PropTypes.string,
});

const reducer = (previousState = initialState, action) => {
  switch (action.type) {
    case actionTypes.NOTIFY:
      return { ...action.payload };
    case actionTypes.NOTIFY_DONE:
      return {};
    default:
      return previousState;
  }
};

export {
  actionTypes as notificationsActionTypes,
  actionEvents as notificationsActionEvents,
  actions as notificationsActions,
  sagas as notificationsSagas,
  reducer as notificationsReducer,
  shape as notificationsShape,
};
