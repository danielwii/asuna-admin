import { Config } from '@asuna-admin/config';

import localforage from 'localforage';

type TTLItem<T = any> = { value: T; timestamp: number; ttl?: number };

export class StorageHelper {
  private static readonly storage: LocalForage = localforage.createInstance({ name: 'storage' });

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

  static async cacheable<T = any>(key: string, fn: () => Promise<T>, ttl: number): Promise<T> {
    const value = await this.getItem(key);
    if (value) return value;

    return this.setItem(key, await fn());
  }
}
