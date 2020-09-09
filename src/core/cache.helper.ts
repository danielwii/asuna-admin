export class CacheHelper {
  private static cache = new Map();

  static async cacheable<T = any>(key: string, fn: () => Promise<T>): Promise<T> {
    const hasValue = this.cache.has(key);
    if (hasValue) {
      return this.cache.get(key);
    }

    const value = await fn();
    this.cache.set(key, value);

    return value;
  }
}
