import { toCamelCase, toSnakeCase } from 'node-buffs';

export function castModelKey(key) {
  const { config } = require('@asuna-admin/core');
  if (config.is('MODEL_KEYS_CASE', 'Camel')) {
    return toCamelCase(key);
  }
  if (config.is('MODEL_KEYS_CASE', 'Snake')) {
    return toSnakeCase(key);
  }
  return key;
}

export function castModelName(key) {
  const { config } = require('@asuna-admin/core');
  if (config.is('MODEL_NAME_CASE', 'Camel')) {
    return toCamelCase(key);
  }
  if (config.is('MODEL_NAME_CASE', 'Snake')) {
    return toSnakeCase(key);
  }
  return key;
}
