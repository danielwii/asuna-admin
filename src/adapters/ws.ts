import getConfig from 'next/config';
import * as Rx from 'rxjs';
import { io, Socket } from 'socket.io-client';

import { Dispatcher } from '../core/dispatcher';
import { Store } from '../core/store';
import { createLogger } from '../logger';
import { appActions } from '../store/app.actions';

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

const logger = createLogger('adapters:ws');

export type NextSocketType = { id: string; socket: Socket };

export class WsAdapter {
  private static socket: any; // typeof io.Socket;
  private port?: number;
  private namespace: string;

  static id: string;

  static readonly subject = new Rx.ReplaySubject(1);

  constructor(opts: { port?: number; namespace?: string } = {}) {
    this.port = opts.port;
    this.namespace = opts.namespace || 'admin';

    if (!(typeof window === 'undefined') && !WsAdapter.socket && getConfig().publicRuntimeConfig.WS_ENDPOINT) {
      const url = `${getConfig().publicRuntimeConfig.WS_ENDPOINT}/${this.namespace}`;
      const options = {
        path: `/socket.io/admin`,
        namespace: this.namespace,
        // secure: true,
        // transports: ['websocket', 'xhr-polling'],
        rememberUpgrade: true,
        reconnectionDelay: 10e3,
        reconnectionDelayMax: 60e3,
      };
      // console.log('init socket.io with', url, options);
      WsAdapter.socket = io(url, options);

      WsAdapter.socket.on('connect', () => {
        logger.log('[connect]', WsAdapter.socket.id);
        WsAdapter.id = WsAdapter.socket.id;
        WsAdapter.subject.next({ id: WsAdapter.id, socket: WsAdapter.socket } as NextSocketType);
        Dispatcher.dispatch(appActions.heartbeat());
      });
      WsAdapter.socket.on('reconnect', () => {
        logger.log('[reconnect]', WsAdapter.socket.id);
        Dispatcher.dispatch(appActions.heartbeat());
      });
      WsAdapter.socket.on('disconnect', () => {
        const { heartbeat } = Store.store.select((state) => state.app);
        logger.error('[disconnect]', WsAdapter.socket.id, { heartbeat });
        if (heartbeat) {
          Dispatcher.dispatch(appActions.heartbeatStop());
        }
      });
      WsAdapter.socket.on('error', (error) => {
        const { heartbeat } = Store.store.select((state) => state.app);
        logger.error('[error]', WsAdapter.socket.id, { heartbeat, error });
        if (heartbeat) {
          Dispatcher.dispatch(appActions.heartbeatStop());
        }
      });
    }
  }
}
