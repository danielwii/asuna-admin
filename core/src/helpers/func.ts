import * as _ from 'lodash';
import * as qs from 'qs';
import * as url from 'url';

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
  return _.flow([_.curryRight(removeSuffix)(suffix), _.curryRight(removePrefix)(prefix)])(value);
}

export function resolveDownloadUrl(href?: string): string {
  if (_.isString(href)) {
    const parsed = url.parse(href, true);
    parsed.query.download = '';
    return url.resolve(parsed.href, parsed.pathname + "?" + qs.stringify(parsed.query));
  }
  return '';
}

export function parseString(value?: any): string {
  return value ? (_.isString(value) ? value : JSON.stringify(value)) : '';
}

export function parseJSONIfCould(value?: string): any {
  try {
    if (value) return JSON.parse(value);
  } catch (e) {}
  return value;
}

export function extractValue(o: any, extractor?: ((o: any) => any) | string): any {
  if (_.isArray(o)) {
    return _.map(o, (i) => extractValue(i, extractor));
  }
  if (_.isFunction(extractor)) {
    return extractor(o);
  }
  if (_.isString(extractor)) {
    return _.get(o, extractor);
  }
  return o;
}
