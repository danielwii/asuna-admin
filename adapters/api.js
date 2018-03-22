import { createLogger } from '../adapters/logger';

const logger = createLogger('adapters:api');

export const apiProxy = {
  upload    : ({ token }, file, options) => global.context.api.upload({ token }, file, options),
  getVersion: ({ token }) => global.context.api.getVersion({ token }),
};

export class ApiAdapter {
  constructor(service) {
    this.service = service;
  }

  upload = ({ token }, file, options) => {
    logger.log('[upload] file', file, options);
    return this.service.upload({ token }, file, options);
  };

  getVersion = ({ token }) => this.service.getVersion({ token });
}
