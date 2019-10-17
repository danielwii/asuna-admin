import _ from 'lodash';
import * as R from 'ramda';

import { isPanesModule, panesActionTypes } from './panes.actions';

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

interface PanesState {
  activeKey: string | null;
  panes: object;
}

const initialState: PanesState = {
  activeKey: null,
  panes: {},
};

const panesCleaner = rootState => ({ ...rootState, panes: initialState });

const panesReducer = (previousState = initialState, action) => {
  function popToNext(activeKey, panes, key) {
    const index = R.compose(
      R.indexOf(activeKey),
      R.keys,
    )(panes);
    const nextPanes = _.omit(panes, key);

    const nextKeys = _.keys(nextPanes);
    const nextKey =
      activeKey && _.has(nextPanes, activeKey)
        ? activeKey
        : // 关闭当前 tab 时定位到后面一个 tab
          nextKeys[_.min([index, nextKeys.length - 1]) as number];
    return { nextPanes, nextKey };
  }

  if (isPanesModule(action)) {
    switch (action.type) {
      case panesActionTypes.OPEN: {
        const {
          payload: { pane },
        } = action;
        return { activeKey: pane.key, panes: { ...previousState.panes, [pane.key]: pane } };
      }
      case panesActionTypes.ACTIVE: {
        const {
          payload: { key },
        } = action;
        return { ...previousState, activeKey: key };
      }
      case panesActionTypes.CLOSE: {
        const { activeKey, panes } = previousState;
        const {
          payload: { key },
        } = action;

        // 这里 activeKey 和 key 应该是一样的
        const { nextPanes, nextKey } = popToNext(activeKey, panes, key);
        return { activeKey: nextKey, panes: nextPanes };
      }
      case panesActionTypes.CLOSE_ALL: {
        return {};
      }
      case panesActionTypes.CLOSE_WITHOUT: {
        const {
          payload: { activeKey },
        } = action;
        if (activeKey) {
          const panes = R.pick([activeKey])(previousState.panes);
          return R.merge(previousState, { panes });
        }
        return {};
      }
      case panesActionTypes.CLOSE_CURRENT: {
        const {
          payload: { activeKey },
        } = action;
        if (activeKey) {
          const { nextPanes, nextKey } = popToNext(activeKey, previousState.panes, activeKey);
          return R.merge(previousState, { activeKey: nextKey, panes: nextPanes });
        }
        return {};
      }
      default:
        return { ...previousState, ...action.payload };
    }
  }
  return previousState;
};

export { panesSagas, panesCleaner, panesReducer };
