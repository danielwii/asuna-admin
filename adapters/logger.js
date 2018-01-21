/* eslint-disable no-console */
import debug from 'debug';

export const logger = console;

export const createLogger = (module, level = 2) => {
  const error = debug(`${module}:error`);
  error.log   = console.error.bind(console);
  const warn  = debug(`${module}:warn`);
  warn.log    = console.warn.bind(console);
  const log   = debug(`${module}`);
  log.log     = console.log.bind(console);
  const info  = debug(`${module}:info`);
  info.log    = console.info.bind(console);
  const trace = debug(`${module}:trace`);
  trace.log   = console.trace.bind(console);

  return {
    trace: (...args) => {
      if (level < 1) trace(...args);
    },
    info : (...args) => {
      if (level < 2) info(...args);
    },
    log  : (...args) => {
      if (level < 3) log(...args);
    },
    warn : (...args) => {
      if (level < 4) warn(...args);
    },
    error: (...args) => {
      if (level < 5) error(...args);
    },
  };
};
