import { AxiosResponse, AxiosRequestConfig } from 'axios';

import { createLogger } from '@asuna-admin/logger';
import { AppContext } from '@asuna-admin/core';

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

export interface IApiService {
  upload(
    param: { token: string | null },
    file: any,
    options: { bucket?: string },
    requestConfig?: AxiosRequestConfig,
  ): Promise<AxiosResponse<Asuna.Schema.UploadResponse[]>>;

  getVersion(param: { token: string | null }): Promise<AxiosResponse>;

  /**
   * 申请 token
   * @param opts
   */
  acquireOperationToken(opts: { payload: { service: string } }): Promise<AxiosResponse>;

  /**
   * 使用 token
   * @param opts
   */
  useOperationToken(opts: { payload: { token: string } }): Promise<AxiosResponse>;

  /**
   * 释放 token
   * @param opts
   */
  releaseOperationToken(opts: { payload: { token: string } }): Promise<AxiosResponse>;
}

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

const logger = createLogger('adapters:api');

export const apiProxy = {
  upload(
    file,
    options = {},
    requestConfig?: AxiosRequestConfig,
  ): Promise<AxiosResponse<Asuna.Schema.UploadResponse[]>> {
    return AppContext.ctx.api.upload(file, options, requestConfig);
  },
  getVersion(): Promise<AxiosResponse> {
    return AppContext.ctx.api.getVersion();
  },
  acquireOperationToken(service: string): Promise<AxiosResponse> {
    return AppContext.ctx.api.acquireOperationToken(service);
  },
  useOperationToken(token: string): Promise<AxiosResponse> {
    return AppContext.ctx.api.useOperationToken(token);
  },
  releaseOperationToken(token: string): Promise<AxiosResponse> {
    return AppContext.ctx.api.releaseOperationToken(token);
  },
};

export class ApiAdapter {
  private service: IApiService;

  constructor(service: IApiService) {
    this.service = service;
  }

  upload = (
    file,
    options: { bucket?: string },
    requestConfig?: AxiosRequestConfig,
  ): Promise<AxiosResponse<Asuna.Schema.UploadResponse[]>> => {
    logger.log('[upload] file', file, options);
    const auth = AppContext.fromStore('auth');
    return this.service.upload(auth, file, options, requestConfig);
  };

  getVersion = (): Promise<AxiosResponse> => {
    const auth = AppContext.fromStore('auth');
    return this.service.getVersion(auth);
  };

  acquireOperationToken = (service: string): Promise<AxiosResponse> => {
    return this.service.acquireOperationToken({ payload: { service } });
  };
  useOperationToken = (token: string): Promise<AxiosResponse> => {
    return this.service.useOperationToken({ payload: { token } });
  };
  releaseOperationToken = (token: string): Promise<AxiosResponse> => {
    return this.service.releaseOperationToken({ payload: { token } });
  };
}
