import { toCamelCase, toSnakeCase } from 'node-buffs';

import { config } from '../app/configure';

export function castModelKey(key) {
  if (config.is('MODEL_KEYS_CASE', 'Camel')) {
    return toCamelCase(key);
  }
  if (config.is('MODEL_KEYS_CASE', 'Snake')) {
    return toSnakeCase(key);
  }
  return key;
}

export function castModelName(key) {
  if (config.is('MODEL_NAME_CASE', 'Camel')) {
    return toCamelCase(key);
  }
  if (config.is('MODEL_NAME_CASE', 'Snake')) {
    return toSnakeCase(key);
  }
  return key;
}
