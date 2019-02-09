import { connect, Socket } from 'socket.io-client';

import { appActions } from '@asuna-admin/store';
import { AppContext } from '@asuna-admin/core';
import { createLogger } from '@asuna-admin/logger';

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

const logger = createLogger('adapters:ws', 'warn');

export class WsAdapter {
  private port?: number;
  private namespace: string;

  private static io: typeof Socket;

  constructor(opts: { port?: number; namespace?: string } = {}) {
    this.port = opts.port;
    this.namespace = opts.namespace || 'admin';

    if (!AppContext.isServer && !WsAdapter.io) {
      WsAdapter.io = connect('/admin');

      WsAdapter.io.on('connect', () => {
        logger.log('[connect]', { id: WsAdapter.io.id, AppContext });
        AppContext.dispatch(appActions.heartbeat());
      });
      WsAdapter.io.on('reconnect', () => {
        logger.log('[reconnect]', { id: WsAdapter.io.id, AppContext });
        AppContext.dispatch(appActions.heartbeat());
      });
      WsAdapter.io.on('disconnect', () => {
        const { heartbeat } = AppContext.store.select(state => state.app);
        logger.error('[disconnect]', { id: WsAdapter.io.id, heartbeat });
        if (heartbeat) {
          AppContext.dispatch(appActions.heartbeatStop());
        }
      });
      WsAdapter.io.on('error', error => {
        const { heartbeat } = AppContext.store.select(state => state.app);
        logger.error('[error]', { id: WsAdapter.io.id, heartbeat, error });
        if (heartbeat) {
          AppContext.dispatch(appActions.heartbeatStop());
        }
      });
    }
  }
}
