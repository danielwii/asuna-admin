import { reduxAction } from 'node-buffs/dist/redux';

export const actionTypes = {
  CLEAN: 'sys::clean',
};

export const actions = {
  clean: () => reduxAction(actionTypes.CLEAN),
};
