/* eslint-disable no-console */
import debug from 'debug';

export const logger = console;

let allDebugStr = '*';

export const initDebug = () => {
  localStorage.debug = allDebugStr;
};

export const createLogger = (module, debugStr = '') => {
  if (debugStr && allDebugStr.indexOf(debugStr) <= 0) {
    allDebugStr = `${allDebugStr},-${module}${debugStr}`;
  }
  const log   = debug(`${module}`);
  log.log     = console.log.bind(console);
  const info  = debug(`${module}:info`);
  info.log    = console.info.bind(console);
  const warn  = debug(`${module}:warn`);
  warn.log    = console.error.bind(console);
  const error = debug(`${module}:error`);
  error.log   = console.error.bind(console);
  return {
    log, info, warn, error,
  };
};
