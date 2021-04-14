import localForage from 'localforage';

import { Config } from '../config';

type TTLItem<T = any> = { value: T; timestamp: number; ttl?: number };

export class StorageHelper {
  private static readonly storage: LocalForage = localForage.createInstance({ name: 'storage' });

  static async setItem<T = any>(key: string, value: T, ttl?: number): Promise<T> {
    if (this.storage && !Config.isServer) {
      await this.storage.setItem<TTLItem<T>>(key, { value, timestamp: Date.now(), ttl });
    }
    return value;
  }

  static async getItem<T = any>(key: string): Promise<T | undefined> {
    if (this.storage && !Config.isServer) {
      const item = await this.storage.getItem<TTLItem<T>>(key);
      if (item) {
        const { value, timestamp, ttl } = item;
        if (!ttl || Date.now() - timestamp >= ttl) {
          return value;
        }
      }
      await this.storage.removeItem(key);
    }
    return undefined;
  }
}
