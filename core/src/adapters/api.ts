import { AppContext } from '@asuna-admin/core';
import { createLogger } from '@asuna-admin/logger';
import { Asuna } from '@asuna-admin/types';

import { AxiosRequestConfig, AxiosResponse } from 'axios';

const logger = createLogger('adapters:api');

export interface IApiService {
  upload(
    auth: { token: string | null },
    file: any,
    options: { bucket?: string },
    requestConfig?: AxiosRequestConfig,
  ): Promise<AxiosResponse<Asuna.Schema.UploadResponse[]>>;

  getVersion(auth: { token: string | null }): Promise<AxiosResponse>;

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

  getExcelModel(
    auth: { token: string | null },
    data: { modelName },
    options?: { requestConfig?: AxiosRequestConfig },
  ): Promise<AxiosResponse>;

  importExcel(
    auth: { token: string | null },
    data: { file },
    options?: { requestConfig?: AxiosRequestConfig },
  ): Promise<AxiosResponse>;

  exportExcel(
    auth: { token: string | null },
    data: { modelName },
    options?: { requestConfig?: AxiosRequestConfig },
  ): Promise<AxiosResponse>;

  destroyKv(
    auth: { token: string | null },
    data: { collection: string; key: string },
    options?: { requestConfig?: AxiosRequestConfig },
  ): Promise<AxiosResponse>;

  getWxTicket(auth: { token: string | null }, data: { type: 'admin-login'; value: string }): Promise<AxiosResponse>;
}

export const apiProxy = {
  upload: (
    file,
    options = {},
    requestConfig?: AxiosRequestConfig,
  ): Promise<AxiosResponse<Asuna.Schema.UploadResponse[]>> => AppContext.ctx.api.upload(file, options, requestConfig),
  getVersion: (): Promise<AxiosResponse> => AppContext.ctx.api.getVersion(),
  acquireOperationToken: (service: string): Promise<AxiosResponse> => AppContext.ctx.api.acquireOperationToken(service),
  useOperationToken: (token: string): Promise<AxiosResponse> => AppContext.ctx.api.useOperationToken(token),
  releaseOperationToken: (token: string): Promise<AxiosResponse> => AppContext.ctx.api.releaseOperationToken(token),
  getExcelModel: (auth, data, options): Promise<AxiosResponse> => AppContext.ctx.api.getExcelModel(auth, data, options),
  importExcel: (auth, data, options): Promise<AxiosResponse> => AppContext.ctx.api.importExcel(auth, data, options),
  exportExcel: (auth, data, options): Promise<AxiosResponse> => AppContext.ctx.api.exportExcel(auth, data, options),
  destroyKv: (data): Promise<AxiosResponse> => AppContext.ctx.api.destroyKv(data),
};

export interface ApiAdapter {
  getWxTicket(data: { type: 'admin-login'; value: string }): Promise<{ url: string }>;
}

export class ApiAdapterImpl implements ApiAdapter {
  private service: IApiService;
  constructor(service: IApiService) {
    this.service = service;
  }

  getWxTicket(data): Promise<{ url: string }> {
    return AppContext.withAuth(auth => this.service.getWxTicket(auth, data).then(res => res.data));
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

  acquireOperationToken = (service: string): Promise<AxiosResponse> =>
    this.service.acquireOperationToken({ payload: { service } });
  useOperationToken = (token: string): Promise<AxiosResponse> => this.service.useOperationToken({ payload: { token } });
  releaseOperationToken = (token: string): Promise<AxiosResponse> =>
    this.service.releaseOperationToken({ payload: { token } });
  getExcelModel = (param, data, options): Promise<AxiosResponse> => this.service.getExcelModel(param, data, options);
  importExcel = (param, data, options): Promise<AxiosResponse> => this.service.importExcel(param, data, options);
  exportExcel = (param, data, options): Promise<AxiosResponse> => this.service.exportExcel(param, data, options);
  destroyKv = (data): Promise<AxiosResponse> => {
    const auth = AppContext.fromStore('auth');
    return this.service.destroyKv(auth, data);
  };
}
