import PropTypes from 'prop-types';
import _         from 'lodash';
// import { call, put, takeLatest } from 'redux-saga/effects';

// --------------------------------------------------------------
// Notifications actionTypes
// --------------------------------------------------------------

const actionTypes = {
  // ACTION: 'module::action'
  NOTIFY     : 'notifications::notify',
  NOTIFY_DONE: 'notifications::notify_done',
};

const isCurrentModule = type => type.startsWith('notifications::');

export const notificationTypes = {
  SUCCESS: 'success',
  INFO   : 'info',
  WARN   : 'warn',
  ERROR  : 'error',
};

// --------------------------------------------------------------
// Notifications actions
// --------------------------------------------------------------

const actionEvents = {
  // -
  notify: (message, type = notificationTypes.INFO) =>
    ({ type: actionTypes.NOTIFY, payload: { message, type } }),

  // -
  notifyDone: () => ({ type: actionTypes.NOTIFY_DONE, payload: {} }),
};

const actions = {
  // action: (args): dispatchFunction
  notify    : (message, type) => dispatch => dispatch(actionEvents.notify(message, type)),
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
  type   : PropTypes.oneOf(_.values(notificationTypes)),
});

const reducer = (previousState = initialState, action) => {
  if (isCurrentModule(action.type)) {
    switch (action.type) {
      case actionTypes.NOTIFY:
      case actionTypes.NOTIFY_DONE:
        return { ...action.payload };
        // return {};
      default:
        return { ...previousState, ...action.payload };
    }
  } else {
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
