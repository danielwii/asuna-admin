import { toCamelCase, toSnakeCase } from 'node-buffs/dist/strings';

import { Config } from '../config';

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
