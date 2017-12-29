import _      from 'lodash';
import * as R from 'ramda';
// import { call, put, takeLatest } from 'redux-saga/effects';

// --------------------------------------------------------------
// Module actionTypes
// --------------------------------------------------------------

const actionTypes = {
  // ACTION: 'module::action'
  ADD  : 'panes::add',
  OPEN : 'panes::open',
  CLOSE: 'panes::close',
};

const isCurrentModule = type => type.startsWith('panes::');

// --------------------------------------------------------------
// Module actions
// --------------------------------------------------------------

const actionEvents = {
  // action: (args): ({ type, payload })
  add  : pane => ({ type: actionTypes.ADD, payload: { pane } }),
  open : key => ({ type: actionTypes.OPEN, payload: { key } }),
  close: key => ({ type: actionTypes.CLOSE, payload: { key } }),
};

// TODO remove actions and rename actionEvents to actions
const actions = dispatch => ({
  // action: (args): dispatchFunction with actionEvent
  add  : pane => dispatch(actionEvents.add(pane)),
  open : key => dispatch(actionEvents.open(key)),
  close: key => dispatch(actionEvents.close(key)),
});

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

const initialState = {
  activeKey: null,
  panes    : {},
};

const reducer = (previousState = initialState, action) => {
  if (isCurrentModule(action.type)) {
    switch (action.type) {
      case actionTypes.ADD: {
        const { payload: { pane } } = action;
        return { activeKey: pane.key, panes: { ...previousState.panes, [pane.key]: pane } };
      }
      case actionTypes.OPEN: {
        const { payload: { key } } = action;
        return { ...previousState, activeKey: key };
      }
      case actionTypes.CLOSE: {
        const { activeKey, panes } = previousState;
        const { payload: { key } } = action;

        const index     = R.compose(R.indexOf(activeKey), R.keys)(panes);
        const nextPanes = _.omit(panes, key);

        const nextKeys = _.keys(nextPanes);
        const nextKey  = _.has(nextPanes, activeKey)
          ? activeKey
          // 关闭当前 tab 时定位到后面一个 tab
          : nextKeys[_.min([index, nextKeys.length - 1])];
        return { activeKey: nextKey, panes: nextPanes };
      }
      default:
        return { ...previousState, ...action.payload };
    }
  } else {
    return previousState;
  }
};

export {
  actionTypes as panesActionTypes,
  actionEvents as panesActionEvents,
  actions as panesActions,
  sagas as panesSagas,
  reducer as panesReducer,
};
