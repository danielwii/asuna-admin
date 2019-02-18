import { reduxAction } from 'node-buffs';
import { ReactElement } from 'react';

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
  open: (pane: {
    key: string;
    title: string;
    linkTo: 'content::upsert' | 'content::insert' | string;
    data?: { modelName; record } | any;
    component?: ReactElement<any, any>;
  }) => reduxAction(panesActionTypes.OPEN, { pane }),
  active: key => reduxAction(panesActionTypes.ACTIVE, { key }),
  close: key => reduxAction(panesActionTypes.CLOSE, { key }),
  closeAll: () => reduxAction(panesActionTypes.CLOSE_ALL),
  onCloseWithout: activeKey => reduxAction(panesActionTypes.CLOSE_WITHOUT, { activeKey }),
};
