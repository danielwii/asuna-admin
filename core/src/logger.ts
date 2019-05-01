import debug from 'debug';
import { Storage } from './core/storage';

export const modules: { [key: string]: keyof typeof lv } = {};

let initialized = false;
const storage = new Storage().instance;
storage.getItem('debug.modules').then(stored => {
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
  storage.setItem('debug.modules', modules);
};

export const createLogger = (module, level: keyof typeof lv = 'warn') => {
  if (!modules[module] || level !== 'warn') {
    modules[module] = level;
  }

  if (initialized && level !== 'warn') {
    storage.setItem('debug.modules', modules);
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
      if (lv[modules[module]] < 2) (info as any)(...args);
    },
    log: (...args) => {
      if (lv[modules[module]] < 3) (log as any)(...args);
    },
    warn: (...args) => {
      if (lv[modules[module]] < 4) (warn as any)(...args);
    },
    error: (...args) => {
      if (lv[modules[module]] < 5) (error as any)(...args);
    },
  };
};
