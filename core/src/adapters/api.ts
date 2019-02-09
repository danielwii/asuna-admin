import { AxiosResponse } from 'axios';

import { createLogger } from '@asuna-admin/logger';
import { AppContext } from '@asuna-admin/core';

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

export interface IApiService {
  upload(
    param: { token: string | null },
    file: any,
    options: any,
  ): Promise<AxiosResponse<Asuna.Schema.UploadResponse[]>>;

  getVersion(param: { token: string | null }): Promise<AxiosResponse>;
}

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

const logger = createLogger('adapters:api');

export const apiProxy = {
  upload(file, options?): Promise<AxiosResponse<Asuna.Schema.UploadResponse[]>> {
    return AppContext.ctx.api.upload(file, options);
  },
  getVersion(): Promise<AxiosResponse> {
    return AppContext.ctx.api.getVersion();
  },
};

export class ApiAdapter {
  private service: IApiService;

  constructor(service: IApiService) {
    this.service = service;
  }

  upload = (file, options): Promise<AxiosResponse<Asuna.Schema.UploadResponse[]>> => {
    logger.log('[upload] file', file, options);
    const auth = AppContext.fromStore('auth');
    return this.service.upload(auth, file, options);
  };

  getVersion = (): Promise<AxiosResponse> => {
    const auth = AppContext.fromStore('auth');
    return this.service.getVersion(auth);
  };
}
