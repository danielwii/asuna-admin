/* eslint-disable no-console */
import debug from 'debug';

export const logger = console;

let allDebugStr = '*';

export const initDebug = () => {
  localStorage.debug = allDebugStr;
};

export const createLogger = (module, debugStr = '') => {
  if (debugStr && allDebugStr.indexOf(debugStr) <= 0) {
    allDebugStr = `${allDebugStr},${debugStr}`;
  }
  const log         = debug(`${module}`);
  log.log           = console.log.bind(console);
  const info        = debug(`${module}:info`);
  info.log          = console.info.bind(console);
  const debugLogger = debug(`${module}:debug`);
  debugLogger.log   = console.debug.bind(console);
  const error       = debug(`${module}:error`);
  error.log         = console.error.bind(console);
  return {
    log, info, debug: debugLogger, error,
  };
};
