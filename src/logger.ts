import consola, { LogLevel } from 'consola';

export const createLogger = (module, level: LogLevel = LogLevel.Warn) => {
  return consola.withScope(module).create({ level: level });
};
