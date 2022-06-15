import { createLogger } from '../logger';

import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import type { Asuna } from '../types';

const logger = createLogger('adapters:api');

export interface IApiService {
  upload(
    file: any,
    options: { bucket?: string; prefix?: string },
    requestConfig?: AxiosRequestConfig,
  ): Promise<AxiosResponse<Asuna.Schema.UploadResponse[]>>;

  getVersion(): Promise<AxiosResponse>;

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

  getExcelModel(data: { modelName }, options?: { requestConfig?: AxiosRequestConfig }): Promise<AxiosResponse>;

  importExcel(data: { file }, options?: { requestConfig?: AxiosRequestConfig }): Promise<AxiosResponse>;

  exportExcel(data: { modelName }, options?: { requestConfig?: AxiosRequestConfig }): Promise<AxiosResponse>;

  destroyKv(
    data: { collection: string; key: string },
    options?: { requestConfig?: AxiosRequestConfig },
  ): Promise<AxiosResponse>;

  getWxTicket(data: { type: 'admin-login'; value: string }): Promise<AxiosResponse>;
}

export interface ApiAdapter {
  getWxTicket(data: { type: 'admin-login'; value: string }): Promise<{ url: string }>;
}

export class ApiAdapterImpl implements ApiAdapter {
  private service: IApiService;
  constructor(service: IApiService) {
    this.service = service;
  }

  getWxTicket = (data): Promise<{ url: string }> => this.service.getWxTicket(data).then((res) => res.data);

  upload = (
    file,
    options: { bucket?: string; prefix?: string },
    requestConfig?: AxiosRequestConfig,
  ): Promise<AxiosResponse<Asuna.Schema.UploadResponse[]>> => {
    logger.log('[upload] file', file, options);
    return this.service.upload(file, options, requestConfig);
  };

  getVersion = (): Promise<AxiosResponse> => this.service.getVersion();

  acquireOperationToken = (service: string): Promise<AxiosResponse> =>
    this.service.acquireOperationToken({ payload: { service } });
  useOperationToken = (token: string): Promise<AxiosResponse> => this.service.useOperationToken({ payload: { token } });
  releaseOperationToken = (token: string): Promise<AxiosResponse> =>
    this.service.releaseOperationToken({ payload: { token } });
  getExcelModel = (data, options): Promise<AxiosResponse> => this.service.getExcelModel(data, options);
  importExcel = (data, options): Promise<AxiosResponse> => this.service.importExcel(data, options);
  exportExcel = (data, options): Promise<AxiosResponse> => this.service.exportExcel(data, options);
  destroyKv = (data): Promise<AxiosResponse> => this.service.destroyKv(data);
}
