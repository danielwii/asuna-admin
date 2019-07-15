import { Asuna } from '@asuna-admin/types';

import { reduxAction } from 'node-buffs';

// --------------------------------------------------------------
// Module actionTypes
// --------------------------------------------------------------

export const panesActionTypes = {
  // ACTION: 'module::action'
  OPEN: 'panes::open',
  ACTIVE: 'panes::active',
  CLOSE: 'panes::close',
  CLOSE_ALL: 'panes::close-all',
  CLOSE_WITHOUT: 'panes::close-without',
};

export const isPanesModule = action => action.type.startsWith('panes::') && !action.transient;

// --------------------------------------------------------------
// Module actions
// --------------------------------------------------------------

export const panesActions = {
  // action: (args) => ({ type, payload })
  open: (pane: Asuna.Schema.Pane) => reduxAction(panesActionTypes.OPEN, { pane }),
  active: key => reduxAction(panesActionTypes.ACTIVE, { key }),
  close: key => reduxAction(panesActionTypes.CLOSE, { key }),
  closeAll: () => reduxAction(panesActionTypes.CLOSE_ALL),
  onCloseWithout: activeKey => reduxAction(panesActionTypes.CLOSE_WITHOUT, { activeKey }),
};
