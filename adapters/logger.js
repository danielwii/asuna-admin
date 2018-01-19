/* eslint-disable no-console */
import debug  from 'debug';
import * as R from 'ramda';

export const logger = console;

const levels = [
  'trace', 'info', 'log', 'warn', 'error',
];

export const createLogger = (module, level = 'log') => {
  const levelIndex = R.indexOf(level)(levels);

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
      if (levelIndex < 1) trace(...args);
    },
    info : (...args) => {
      if (levelIndex < 2) info(...args);
    },
    log  : (...args) => {
      if (levelIndex < 3) log(...args);
    },
    warn : (...args) => {
      if (levelIndex < 4) warn(...args);
    },
    error: (...args) => {
      if (levelIndex < 5) error(...args);
    },
  };
};
