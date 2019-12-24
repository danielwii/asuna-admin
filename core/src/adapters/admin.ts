import { AppContext } from '@asuna-admin/core';
import { Json, Asuna } from '@asuna-admin/types';
import { AxiosResponse } from 'axios';
import { plainToClass } from 'class-transformer';

export interface IAdminService {
  tenantInfo(auth: { token: string | null }): Promise<AxiosResponse>;
  registerTenant(auth: { token: string | null }, data: { name: string; description?: string }): Promise<AxiosResponse>;
  createDraft(
    auth: { token: string | null },
    data: { content: Json; type: string; refId: string | number },
  ): Promise<AxiosResponse>;
}

export class TenantInfo {
  config?: Partial<{
    enabled: boolean;
    bindRoles: string;
    firstModelName: string;
    firstDisplayName: string;
  }>;
  tenant?: Tenant;
  roles: string[];
  recordCounts: { [name: string]: { total: number; published?: number } };
  entities: { [name: string]: Asuna.Schema.EntityInfo };
}

export class Tenant {
  id: string;
  name: string;
  description?: string;
  isPublished?: boolean;
}

export class Draft {
  content: Json;
  type: string;
  refId: string | number;
}

export interface AdminAdapter {
  tenantInfo(): Promise<TenantInfo>;
  registerTenant(data: { name: string; description?: string }): Promise<Tenant>;
  createDraft(data: { content: Json; type: string; refId: string | number }): Promise<Draft>;
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

  async createDraft(data: { content: Json; type: string; refId: string | number }): Promise<Draft> {
    return AppContext.withAuth(auth => this.service.createDraft(auth, data).then(res => plainToClass(Draft, res.data)));
  }
}

export const adminProxyCaller: () => AdminAdapter = () => AppContext.ctx.admin;
