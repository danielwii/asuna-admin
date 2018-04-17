import debug from 'debug';

export const lv = ({
  trace: 0,
  info : 1,
  log  : 2,
  warn : 3,
  error: 4,
});

export const createLogger = (module, level = lv.warn) => {
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
      if (level < 1) (trace as any)(...args);
    },
    info : (...args) => {
      if (level < 2) (info as any)(...args);
    },
    log  : (...args) => {
      if (level < 3) (log as any)(...args);
    },
    warn : (...args) => {
      if (level < 4) (warn as any)(...args);
    },
    error: (...args) => {
      if (level < 5) (error as any)(...args);
    },
  };
};
