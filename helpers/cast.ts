import { toCamelCase, toSnakeCase } from 'node-buffs';

import { config, ConfigKeys, StringCase } from 'app/configure';

// eslint-disable-next-line import/prefer-default-export
export function cast(key) {
  if (config.is(ConfigKeys.MODEL_KEYS_CASE, StringCase.Camel)) {
    return toCamelCase(key);
  } else if (config.is(ConfigKeys.MODEL_KEYS_CASE, StringCase.Snake)) {
    return toSnakeCase(key);
  }
  return key;
}
