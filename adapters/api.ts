import { appContext } from '../core/context';
import { AxiosResponse } from 'axios';

import { createLogger } from '@asuna-admin/helpers';

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

export interface IApiService {
  upload(param: { token: string }, file: any, options: any): any;

  getVersion(param: { token: string }): any;
}

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

const logger = createLogger('adapters:api');

export const apiProxy = {
  upload: ({ token }, file, options?): AxiosResponse<Asuna.Schema.UploadResponse[]> =>
    appContext.ctx.api.upload({ token }, file, options),
  getVersion: ({ token }): string => appContext.ctx.api.getVersion({ token }),
};

export class ApiAdapter {
  private service: IApiService;

  constructor(service: IApiService) {
    this.service = service;
  }

  upload = ({ token }, file, options): AxiosResponse<Asuna.Schema.UploadResponse[]> => {
    logger.log('[upload] file', file, options);
    return this.service.upload({ token }, file, options);
  };

  getVersion = ({ token }): string => this.service.getVersion({ token });
}
