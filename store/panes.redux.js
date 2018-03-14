import _      from 'lodash';
import * as R from 'ramda';
// import { call, put, takeLatest } from 'redux-saga/effects';

// --------------------------------------------------------------
// Module actionTypes
// --------------------------------------------------------------

const panesActionTypes = {
  // ACTION: 'module::action'
  OPEN     : 'panes::open',
  ACTIVE   : 'panes::active',
  CLOSE    : 'panes::close',
  CLOSE_ALL: 'panes::close-all',
};

const isCurrent = type => type.startsWith('panes::');

// --------------------------------------------------------------
// Module actions
// --------------------------------------------------------------

const panesActions = {
  // action: (args) => ({ type, payload })
  open    : pane => ({ type: panesActionTypes.OPEN, payload: { pane } }),
  active  : key => ({ type: panesActionTypes.ACTIVE, payload: { key } }),
  close   : key => ({ type: panesActionTypes.CLOSE, payload: { key } }),
  closeAll: () => ({ type: panesActionTypes.CLOSE_ALL }),
};

// --------------------------------------------------------------
// Module sagas
// function* actionSage(args) {
//   yield call; yield puy({ type: actionType, payload: {} })
// }
// --------------------------------------------------------------

const panesSagas = [
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

const panesCleaner = rootState => ({ ...rootState, panes: initialState });

const panesReducer = (previousState = initialState, action) => {
  if (isCurrent(action.type)) {
    switch (action.type) {
      case panesActionTypes.OPEN: {
        const { payload: { pane } } = action;
        return { activeKey: pane.key, panes: { ...previousState.panes, [pane.key]: pane } };
      }
      case panesActionTypes.ACTIVE: {
        const { payload: { key } } = action;
        return { ...previousState, activeKey: key };
      }
      case panesActionTypes.CLOSE: {
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
      case panesActionTypes.CLOSE_ALL: {
        return {};
      }
      default:
        return { ...previousState, ...action.payload };
    }
  } else {
    return previousState;
  }
};

export {
  panesActionTypes,
  panesActions,
  panesSagas,
  panesCleaner,
  panesReducer,
};
