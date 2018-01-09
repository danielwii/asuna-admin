import { put, takeEvery } from 'redux-saga/effects';

import _                from 'lodash';
import { notification } from 'antd';

// --------------------------------------------------------------
// Notifications actionTypes
// --------------------------------------------------------------

const actionTypes = {
  // ACTION: 'module::action'
  NOTIFY        : 'notifications::notify',
  NOTIFY_SUCCESS: 'notifications::notify-success',
};

const isCurrent = type => type.startsWith('notifications::');

export const notificationTypes = {
  SUCCESS: 'success',
  INFO   : 'info',
  WARN   : 'warn',
  ERROR  : 'error',
};

// --------------------------------------------------------------
// Notifications actions
// --------------------------------------------------------------

const actions = {
  notifyError: error => ({
    type   : actionTypes.NOTIFY,
    payload: { message: error, type: notificationTypes.ERROR },
  }),
  notify     : (message, type = notificationTypes.INFO) => ({
    type   : actionTypes.NOTIFY,
    payload: { message, type },
  }),
  notifyDone : () => ({ type: actionTypes.NOTIFY_SUCCESS, payload: {} }),
};

// --------------------------------------------------------------
// Notifications sagas
// function* actionSage(args) {
//   yield call; yield puy({ type: actionType, payload: {} })
// }
// --------------------------------------------------------------

/**
 * 采用 antd 的 notification 方法发起通知
 * 暂时没有必要做更高级别的抽象
 * @param message
 * @param type
 */
function* notify({ payload: { message, type } }) {
  if (type !== notificationTypes.ERROR) {
    // 普通模式下只显示通知信息
    notification[type]({ message });
  } else {
    // message 为 error 时，解构是否为服务端错误
    // const { response: { data: serverError } } = message;
    const serverError = _.get(message, 'response.data');
    if (serverError) {
      notification[type]({
        message    : message.message,
        description: JSON.stringify(serverError),
      });
    } else if (_.isString(message)) {
      notification[type]({ message });
    } else {
      console.error(message);
      notification[type]({
        message: message.message,
      });
    }
  }
  yield put(actions.notifyDone());
}

const sagas = [
  // takeLatest / takeEvery (actionType, actionSage)
  takeEvery(actionTypes.NOTIFY, notify),
];

// --------------------------------------------------------------
// Notifications reducers
// action = { payload: any? }
// --------------------------------------------------------------

const initialState = {};

const reducer = (previousState = initialState, action) => {
  if (isCurrent(action.type)) {
    switch (action.type) {
      case actionTypes.NOTIFY:
      case actionTypes.NOTIFY_SUCCESS:
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
  actions as notificationsActions,
  sagas as notificationsSagas,
  reducer as notificationsReducer,
};
