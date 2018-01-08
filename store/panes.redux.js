import _      from 'lodash';
import * as R from 'ramda';
// import { call, put, takeLatest } from 'redux-saga/effects';

// --------------------------------------------------------------
// Module actionTypes
// --------------------------------------------------------------

const actionTypes = {
  // ACTION: 'module::action'
  OPEN  : 'panes::open',
  ACTIVE: 'panes::active',
  CLOSE : 'panes::close',
};

const isCurrentModule = type => type.startsWith('panes::');

// --------------------------------------------------------------
// Module actions
// --------------------------------------------------------------

const actions = {
  // action: (args): ({ type, payload })
  open  : pane => ({ type: actionTypes.OPEN, payload: { pane } }),
  active: key => ({ type: actionTypes.ACTIVE, payload: { key } }),
  close : key => ({ type: actionTypes.CLOSE, payload: { key } }),
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

const initialState = {
  activeKey: null,
  panes    : {},
};

const reducer = (previousState = initialState, action) => {
  if (isCurrentModule(action.type)) {
    switch (action.type) {
      case actionTypes.OPEN: {
        const { payload: { pane } } = action;
        return { activeKey: pane.key, panes: { ...previousState.panes, [pane.key]: pane } };
      }
      case actionTypes.ACTIVE: {
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
  actions as panesActions,
  sagas as panesSagas,
  reducer as panesReducer,
};
