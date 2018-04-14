import { createLogger } from 'helpers';

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

interface IApiService {
  upload(param: { token: string }, file: any, options: any): any;

  getVersion(param: { token: string }): any;

}

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

const logger = createLogger('adapters:api');

export const apiProxy = {
  upload    : ({ token }, file, options) => global.context.api.upload({ token }, file, options),
  getVersion: ({ token }) => global.context.api.getVersion({ token }),
};

export class ApiAdapter {
  constructor(private service: IApiService) {
  }

  upload = ({ token }, file, options) => {
    logger.log('[upload] file', file, options);
    return this.service.upload({ token }, file, options);
  };

  getVersion = ({ token }) => this.service.getVersion({ token });
}
