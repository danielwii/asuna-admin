import { reduxAction } from 'node-buffs';

// --------------------------------------------------------------
// Module actionTypes
// --------------------------------------------------------------

export const appActionTypes = {
  // ACTION: 'module::action'
  INIT                : 'app::init',
  SYNC                : 'app::sync',
  INIT_SUCCESS        : 'app::init-success',
  SYNC_SUCCESS        : 'app::sync-success',
  RESTORED            : 'app::RESTORED',
  /**
   * @deprecated
   */
  LOAD_VERSION        : 'app::load-version',
  LOAD_VERSION_SUCCESS: 'app::load-version-success',
  HEARTBEAT           : 'app::heartbeat',
  HEARTBEAT_ALIVE     : 'app::heartbeat-alive',
  HEARTBEAT_STOP      : 'app::heartbeat-stop',
};

export const isAvailable = action => action.type.startsWith('app::') && !action.transient;

// --------------------------------------------------------------
// Module actions
// --------------------------------------------------------------

export const appActions = {
  // action: (args) => ({ type, payload })
  sync              : () => reduxAction(appActionTypes.SYNC, { loading: true }),
  syncSuccess       : () => reduxAction(appActionTypes.SYNC_SUCCESS, { loading: false }),
  init              : () => reduxAction(appActionTypes.INIT, { loading: true }),
  initSuccess       : () => reduxAction(appActionTypes.INIT_SUCCESS, { loading: false }),
  restored          : () => reduxAction(appActionTypes.RESTORED, { restored: true }),
  /**
   * @deprecated 直接通过 heartbeat 检测版本
   * @returns {{type: string; payload: {}; error: string | object | undefined}}
   */
  loadVersion       : () => reduxAction(appActionTypes.LOAD_VERSION),
  loadVersionSuccess: version => reduxAction(appActionTypes.LOAD_VERSION_SUCCESS, { version }),
  /**
   * 执行心跳检测，同时读取服务端当前的版本，在发现版本不一致时执行同步操作
   * @returns {{type: string; payload: {}; error: string | object | undefined}}
   */
  heartbeat         : () => reduxAction(appActionTypes.HEARTBEAT),
  heartbeatAlive    : () => reduxAction(appActionTypes.HEARTBEAT_ALIVE, { heartbeat: true }),
  heartbeatStop     : () => reduxAction(appActionTypes.HEARTBEAT_STOP, { heartbeat: false }),
};
