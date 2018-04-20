import { toCamelCase, toSnakeCase } from 'node-buffs';

import { config, ConfigKey, StringCase } from '../app/configure';

export function castModelKey(key) {
  if (config.is(ConfigKey.MODEL_KEYS_CASE, StringCase.Camel)) {
    return toCamelCase(key);
  } else if (config.is(ConfigKey.MODEL_KEYS_CASE, StringCase.Snake)) {
    return toSnakeCase(key);
  }
  return key;
}

export function castModelName(key) {
  if (config.is(ConfigKey.MODEL_NAME_CASE, StringCase.Camel)) {
    return toCamelCase(key);
  } else if (config.is(ConfigKey.MODEL_NAME_CASE, StringCase.Snake)) {
    return toSnakeCase(key);
  }
  return key;
}
