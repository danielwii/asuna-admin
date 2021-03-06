import debug from 'debug';
import { StorageHelper } from './core/storage.helper';

export const modules: { [key: string]: keyof typeof lv } = {};

let initialized = false;
StorageHelper.getItem('debug.modules').then((stored) => {
  initialized = true;
  Object.assign(modules, stored);
});

export const lv = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
};

export const updateLoggerLevel = (module, level: keyof typeof lv) => {
  modules[module] = level;
  StorageHelper.setItem('debug.modules', modules);
};

export const createLogger = (module, level: keyof typeof lv = 'warn') => {
  if (!modules[module] || level !== 'warn') {
    modules[module] = level;
  }

  if (initialized && level !== 'warn') {
    StorageHelper.setItem('debug.modules', modules);
  }

  const error = debug(`${module}:error`);
  error.log = console.error.bind(console);
  const warn = debug(`${module}:warn`);
  warn.log = console.warn.bind(console);
  const log = debug(`${module}`);
  log.log = console.log.bind(console);
  const info = debug(`${module}:debug`);
  info.log = console.info.bind(console);
  const trace = debug(`${module}:trace`);
  trace.log = console.trace.bind(console);

  return {
    trace: (...args) => {
      if (lv[modules[module]] < 1) (trace as any)(...args);
    },
    debug: (...args) => {
      if ((global as any).DEBUG_MODE || lv[modules[module]] < 2) (info as any)(...args);
    },
    log: (...args) => {
      if ((global as any).DEBUG_MODE || lv[modules[module]] < 3) (log as any)(...args);
    },
    warn: (...args) => {
      (warn as any)(...args);
    },
    error: (...args) => {
      (error as any)(...args);
    },
  };
};
