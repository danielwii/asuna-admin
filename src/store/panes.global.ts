import _ from 'lodash';
import * as R from 'ramda';
import { createGlobalState } from 'react-use';

import type { Asuna } from '../types';
import type { IHookStateSetAction } from 'react-use/lib/misc/hookState';
import type { Pane } from '../components/Panes';

export interface PanesState {
  activeKey?: string;
  panes: { [key: string]: Pane };
}

const initialState: PanesState = {
  activeKey: undefined,
  panes: {},
};

export const useSharedPanesGlobalValue = createGlobalState<PanesState>(initialState);

export interface SharedPanesFunc {
  active: (key: string) => void;
  closeWithout: (key: string) => void;
  closeAll: () => void;
  close: (key: string) => void;
  open: (pane: Asuna.Schema.Pane) => void;
  closeCurrent: (key: string) => void;
}
/**
 * const [panesState, panesStateSetter] = useSharedPanesGlobalValue();
 * const sharedPanesFunc = useSharedPanesFunc(panesStateSetter);
 * @param setter
 */
export const useSharedPanesFunc = (setter: (state: IHookStateSetAction<PanesState>) => void): SharedPanesFunc => ({
  active: (key: string) => setter((state) => ({ ...state, activeKey: key })),
  close: (key: string) => {
    setter(({ activeKey, panes }) => {
      const { nextPanes, nextKey } = popToNext(activeKey, panes, key);
      return { activeKey: nextKey, panes: nextPanes };
    });
  },
  open: (pane: Asuna.Schema.Pane) =>
    setter(({ panes, activeKey }) => {
      if (_.isEmpty(panes)) {
        return { activeKey: pane.key, panes: { [pane.key]: pane } };
      }
      const entries = Object.entries(panes);
      const index = _.findIndex(entries, ([key]) => key === activeKey);
      const altered = [...entries.slice(0, index + 1), [pane.key, pane], ...entries.slice(index + 1)];
      const merged = Object.fromEntries(altered);
      return { activeKey: pane.key, panes: merged };
    }),
  closeAll: () => setter({ panes: {} }),
  closeWithout: (key: string) =>
    setter((state) => {
      if (key) {
        const panes = R.pick([key])(state.panes);
        return R.merge(state, { panes });
      }
      return { panes: {} };
    }),
  closeCurrent: (key: string) =>
    setter((state) => {
      if (key) {
        const { nextPanes, nextKey } = popToNext(key, state.panes, key);
        return R.merge(state, { activeKey: nextKey, panes: nextPanes });
      }
      return { panes: {} };
    }),
});

function popToNext(activeKey, panes, key) {
  const index = R.compose(R.indexOf(activeKey), R.keys)(panes);
  const nextPanes = _.omit(panes, key);

  const nextKeys = _.keys(nextPanes);
  const nextKey =
    activeKey && _.has(nextPanes, activeKey)
      ? activeKey
      : // 关闭当前 tab 时定位到后面一个 tab
        nextKeys[_.min([index, nextKeys.length - 1]) as number];
  return { nextPanes, nextKey };
}
