import { AxiosResponse } from 'axios';

import { createLogger } from '@asuna-admin/logger';
import { AppContext } from '@asuna-admin/core';
import { AuthState } from '@asuna-admin/store';

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

export interface IApiService {
  upload(
    param: { token: string },
    file: any,
    options: any,
  ): Promise<AxiosResponse<Asuna.Schema.UploadResponse[]>>;

  getVersion(param: { token: string }): string;
}

interface IApiProxy {
  upload(auth: AuthState, file, options?): Promise<AxiosResponse<Asuna.Schema.UploadResponse[]>>;
  getVersion({ token }): string;
}

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

const logger = createLogger('adapters:api');

export const apiProxy: IApiProxy = {
  upload: (auth, file, options?) => AppContext.ctx.api.upload({ token: auth.token }, file, options),
  getVersion: ({ token }) => AppContext.ctx.api.getVersion({ token }),
};

export class ApiAdapter {
  private service: IApiService;

  constructor(service: IApiService) {
    this.service = service;
  }

  upload = ({ token }, file, options): Promise<AxiosResponse<Asuna.Schema.UploadResponse[]>> => {
    logger.log('[upload] file', file, options);
    return this.service.upload({ token }, file, options);
  };

  getVersion = ({ token }): string => this.service.getVersion({ token });
}
