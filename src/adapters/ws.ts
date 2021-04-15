import * as Rx from 'rxjs';
import io from 'socket.io-client';

import { AppContext } from '../core';
import { createLogger } from '../logger';
import { appActions } from '../store';

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

const logger = createLogger('adapters:ws');

export type NextSocketType = { id: string; socket: typeof io.Socket };

export class WsAdapter {
  private static socket: any; // typeof io.Socket;
  private port?: number;
  private namespace: string;

  static id: string;

  static readonly subject = new Rx.ReplaySubject(1);

  constructor(opts: { port?: number; namespace?: string } = {}) {
    this.port = opts.port;
    this.namespace = opts.namespace || 'admin';

    if (!AppContext.isServer && !WsAdapter.socket) {
      WsAdapter.socket = (io as any).connect(`${process.env.NEXT_PUBLIC_WS_ENDPOINT ?? ''}/admin`, {
        secure: true,
        transports: ['websocket', 'xhr-polling'],
        rememberUpgrade: true,
        reconnectionDelay: 10e3,
        reconnectionDelayMax: 60e3,
      });

      WsAdapter.socket.on('connect', () => {
        logger.log('[connect]', WsAdapter.socket.id);
        WsAdapter.id = WsAdapter.socket.id;
        WsAdapter.subject.next({ id: WsAdapter.id, socket: WsAdapter.socket } as NextSocketType);
        AppContext.dispatch(appActions.heartbeat());
      });
      WsAdapter.socket.on('reconnect', () => {
        logger.log('[reconnect]', WsAdapter.socket.id);
        AppContext.dispatch(appActions.heartbeat());
      });
      WsAdapter.socket.on('disconnect', () => {
        const { heartbeat } = AppContext.store.select((state) => state.app);
        logger.error('[disconnect]', WsAdapter.socket.id, { heartbeat });
        if (heartbeat) {
          AppContext.dispatch(appActions.heartbeatStop());
        }
      });
      WsAdapter.socket.on('error', (error) => {
        const { heartbeat } = AppContext.store.select((state) => state.app);
        logger.error('[error]', WsAdapter.socket.id, { heartbeat, error });
        if (heartbeat) {
          AppContext.dispatch(appActions.heartbeatStop());
        }
      });
    }
  }
}
