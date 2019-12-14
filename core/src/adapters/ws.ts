import { AppContext } from '@asuna-admin/core';
import { createLogger } from '@asuna-admin/logger';
import { appActions } from '@asuna-admin/store';
import * as Rx from 'rxjs';
import io from 'socket.io-client';

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

const logger = createLogger('adapters:ws');

export type NextSocketType = { id: string; socket: typeof io.Socket };

export class WsAdapter {
  private static socket: typeof io.Socket;
  private port?: number;
  private namespace: string;

  static id: string;

  static readonly subject = new Rx.ReplaySubject(1);

  constructor(opts: { port?: number; namespace?: string } = {}) {
    this.port = opts.port;
    this.namespace = opts.namespace || 'admin';

    if (!AppContext.isServer && !WsAdapter.socket) {
      WsAdapter.socket = io.connect('/admin', { secure: true, reconnectionDelay: 10e3, reconnectionDelayMax: 60e3 });

      WsAdapter.socket.on('connect', () => {
        logger.log('[connect]', { id: WsAdapter.socket.id, AppContext });
        WsAdapter.id = WsAdapter.socket.id;
        WsAdapter.subject.next({ id: WsAdapter.id, socket: WsAdapter.socket } as NextSocketType);
        AppContext.dispatch(appActions.heartbeat());
      });
      WsAdapter.socket.on('reconnect', () => {
        logger.log('[reconnect]', { id: WsAdapter.socket.id, AppContext });
        AppContext.dispatch(appActions.heartbeat());
      });
      WsAdapter.socket.on('disconnect', () => {
        const { heartbeat } = AppContext.store.select(state => state.app);
        logger.error('[disconnect]', { id: WsAdapter.socket.id, heartbeat });
        if (heartbeat) {
          AppContext.dispatch(appActions.heartbeatStop());
        }
      });
      WsAdapter.socket.on('error', error => {
        const { heartbeat } = AppContext.store.select(state => state.app);
        logger.error('[error]', { id: WsAdapter.socket.id, heartbeat, error });
        if (heartbeat) {
          AppContext.dispatch(appActions.heartbeatStop());
        }
      });
    }
  }
}
