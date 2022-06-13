import { Config } from '../config';

import type { AuthState } from '../store/auth.redux';
import type { IStoreConnector } from '../store/middlewares/store-connector';
import type { RootState } from '../store/types';

/**
 * used by services
 * @param token
 */
export const authHeader = (token?) => {
  const authToken = token || Store.fromStore('auth')?.token;
  const schema = Config.get('AUTH_HEADER');
  return schema === 'AuthHeaderAsBearerToken'
    ? { headers: { Authorization: `Bearer ${authToken}` } }
    : { headers: { Authorization: `${schema} ${authToken}` } };
};

export class Store {
  public static storeConnector: IStoreConnector<RootState>;

  public static regStore(connector: IStoreConnector<RootState>, initialState?: object, force?: boolean) {
    if (!Store.storeConnector || force) {
      Store.storeConnector = connector;
      if (initialState) {
        connector.connect(initialState);
      }
    }
  }

  public static get store() {
    return Store.storeConnector;
  }

  /**
   * 提供了直接通过 redux-store 获取数据的 api
   * @param state
   */
  public static fromStore<K extends keyof RootState>(state: K): RootState[K] {
    if (this.store && this.store.getState) {
      return this.store.getState(state);
    }
    console.error('store is not available or getState not defined on state.');
    return {} as any;
  }

  public static withAuth<T>(func: (auth: AuthState) => T): T {
    return func(Store.fromStore('auth'));
  }
}
