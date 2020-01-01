import { AppContext } from '@asuna-admin/core';
import { Json } from '@asuna-admin/types';
import { AxiosResponse } from 'axios';
import { plainToClass } from 'class-transformer';
import * as _ from 'lodash';
import * as fp from 'lodash/fp';
import { Draft, Tenant, TenantInfo } from './admin.plain';

export interface IAdminService {
  tenantInfo(auth: { token: string | null }): Promise<AxiosResponse>;
  registerTenant(auth: { token: string | null }, data: { name: string; description?: string }): Promise<AxiosResponse>;
  createDraft(
    auth: { token: string | null },
    data: { content: Json; type: string; refId?: string },
  ): Promise<AxiosResponse>;
  getDrafts(auth: { token: string | null }, params: { type: string; refId: string }): Promise<AxiosResponse>;
  publishDraft(auth: { token: string | null }, params: { id: string }): Promise<AxiosResponse>;
}

export interface AdminAdapter {
  tenantInfo(): Promise<TenantInfo>;
  registerTenant(data: { name: string; description?: string }): Promise<Tenant>;
  createDraft(data: { content: Json; type: string; refId?: string | number }): Promise<Draft>;
  getDrafts(params: { type: string; refId: string | number }): Promise<Draft[]>;
  publishDraft(params: { id: string }): Promise<void>;
}

export class AdminAdapterImpl implements AdminAdapter {
  private service: IAdminService;

  constructor(service: IAdminService) {
    this.service = service;
  }

  async tenantInfo(): Promise<TenantInfo> {
    return AppContext.withAuth(auth => this.service.tenantInfo(auth).then(res => plainToClass(TenantInfo, res.data)));
  }

  async registerTenant(data: { name: string; description?: string }): Promise<Tenant> {
    return AppContext.withAuth(auth =>
      this.service.registerTenant(auth, data).then(res => plainToClass(Tenant, res.data)),
    );
  }

  async createDraft(data: { content: Json; type: string; refId?: string }): Promise<Draft> {
    return AppContext.withAuth(auth => this.service.createDraft(auth, data).then(res => plainToClass(Draft, res.data)));
  }

  async getDrafts(params: { type: string; refId: string }): Promise<Draft[]> {
    return AppContext.withAuth(auth =>
      this.service.getDrafts(auth, params).then(res => _.map(res.data, item => plainToClass(Draft, item))),
    );
  }

  async publishDraft(params: { id: string }): Promise<void> {
    return AppContext.withAuth(auth => this.service.publishDraft(auth, params).then(fp.get('data')));
  }
}

export const adminProxyCaller: () => AdminAdapter = () => AppContext.ctx.admin;
