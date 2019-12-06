import _ from 'lodash';

export function extend<T, U>(first: T, second: U): T & U {
  return { ...first, ...second } as T & U;
}

export function removePrefix(value: string, prefix: string): string {
  return value && prefix ? value.replace(new RegExp(`^${prefix}`), '') : value;
}

export function removeSuffix(value: string, suffix: string): string {
  return value && suffix ? value.replace(new RegExp(`${suffix}$`), '') : value;
}

export function removePreAndSuf(value: string, prefix: string, suffix: string): string {
  return _.flow([_.curry(removeSuffix)(_, suffix), _.curry(removePrefix)(_, prefix)])(value);
}

export function parseJSONIfCould(value?: string): any {
  try {
    if (value) return JSON.parse(value);
  } catch (e) {}
  return value;
}

export function extractValue(o: any, extractor?: ((o: any) => any) | string): any {
  if (_.isFunction(extractor)) {
    return extractor(o);
  }
  if (_.isString(extractor)) {
    return _.get(o, extractor);
  }
  return o;
}
