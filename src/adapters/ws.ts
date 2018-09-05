import { connect, Socket } from 'socket.io-client';

import { appActions } from '@asuna-admin/store';
import { createLogger } from '@asuna-admin/logger';
import { AppContext } from '@asuna-admin/core';

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

const logger = createLogger('adapters:ws', 'warn');
const appContext = new AppContext();

export class WsAdapter {
  private port?: number;
  private namespace: string;

  private static io: typeof Socket;

  constructor(opts: { port?: number; namespace?: string } = {}) {
    this.port = opts.port;
    this.namespace = opts.namespace || 'admin';

    if (!AppContext.serverRuntimeConfig.isServer && !WsAdapter.io) {
      WsAdapter.io = connect('/admin');

      WsAdapter.io.on('connect', () => {
        logger.log('[connect]', { id: WsAdapter.io.id, appContext });
        AppContext.dispatch(appActions.heartbeat());
      });
      WsAdapter.io.on('reconnect', () => {
        logger.log('[reconnect]', { id: WsAdapter.io.id, appContext });
        AppContext.dispatch(appActions.heartbeat());
      });
      WsAdapter.io.on('disconnect', () => {
        logger.error('[disconnect]', { id: WsAdapter.io.id, appContext });
        const { heartbeat } = AppContext.store.select(state => state.app);
        if (heartbeat) {
          AppContext.dispatch(appActions.heartbeatStop());
        }
      });
      WsAdapter.io.on('error', error => {
        logger.error('[error]', { id: WsAdapter.io.id, appContext, error });
        const { heartbeat } = AppContext.store.select(state => state.app);
        if (heartbeat) {
          AppContext.dispatch(appActions.heartbeatStop());
        }
      });
    }
  }
}
