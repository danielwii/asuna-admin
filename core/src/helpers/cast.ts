import { toCamelCase, toSnakeCase } from 'node-buffs';

import { Config } from '@asuna-admin/config';

export function castModelKey(key) {
  if (Config.is('MODEL_KEYS_CASE', 'Camel')) {
    return toCamelCase(key);
  }
  if (Config.is('MODEL_KEYS_CASE', 'Snake')) {
    return toSnakeCase(key);
  }
  return key;
}

export function castModelName(key) {
  if (Config.is('MODEL_NAME_CASE', 'Camel')) {
    return toCamelCase(key);
  }
  if (Config.is('MODEL_NAME_CASE', 'Snake')) {
    return toSnakeCase(key);
  }
  return key;
}

export function htmlEntities(unsafeHtml: string): string {
  return String(unsafeHtml)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
