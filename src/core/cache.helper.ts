import { createLogger } from '../logger';

const logger = createLogger('cron-helper');

export class CacheHelper {
  private static cache = new Map();

  static async cacheable<T = any>(key: string, fn: () => Promise<T>): Promise<T> {
    const hasValue = this.cache.has(key);
    logger.info(`cacheable ${key} ${hasValue ? 'hit' : 'miss'}`);
    if (hasValue) {
      return this.cache.get(key);
    }

    const value = await fn();
    this.cache.set(key, value);

    return value;
  }
}
