import localforage from 'localforage';
import { Config } from '@asuna-admin/config';

export class Storage {
  private static INSTANCE: Storage;
  private readonly storage: LocalForage;

  constructor() {
    if (!Storage.INSTANCE && !Config.isServer) {
      this.storage = localforage.createInstance({
        name: 'storage',
      });
      this.storage.setItem('timestamp', new Date());
    }
    Storage.INSTANCE = this;
  }

  get instance() {
    return Storage.INSTANCE;
  }

  async setItem(key: string, value) {
    if (this.storage && !Config.isServer) {
      return this.storage.setItem(key, value);
    }
  }

  async getItem(key: string) {
    if (this.storage && !Config.isServer) {
      return this.storage.getItem(key);
    }
  }
}
