import { AppContext } from '@asuna-admin/core';
import { AxiosResponse } from 'axios';
import { plainToClass } from 'class-transformer';

export interface IAdminService {
  tenantInfo(auth: { token: string | null }): Promise<AxiosResponse>;
  registerTenant(auth: { token: string | null }, data: { name: string; description?: string }): Promise<AxiosResponse>;
}

export class TenantInfo {
  config?: Partial<{
    enabled: boolean;
    bindRoles: string;
    firstModelName: string;
    firstDisplayName: string;
  }>;
  tenant?: Tenant;
  tenantRoles: string[];
  recordCounts: { [name: string]: number };
}

export class Tenant {
  id: string;
  name: string;
  description?: string;
  isPublished?: boolean;
}

export interface AdminAdapter {
  tenantInfo(): Promise<TenantInfo>;
  registerTenant(data: { name: string; description?: string }): Promise<Tenant>;
}

export class AdminAdapterImpl implements AdminAdapter {
  private service: IAdminService;

  constructor(service: IAdminService) {
    this.service = service;
  }

  async tenantInfo(): Promise<TenantInfo> {
    const auth = AppContext.fromStore('auth');
    return this.service.tenantInfo(auth).then(res => plainToClass(TenantInfo, res.data));
  }

  registerTenant(data: { name: string; description?: string }): Promise<Tenant> {
    const auth = AppContext.fromStore('auth');
    return this.service.registerTenant(auth, data).then(res => plainToClass(Tenant, res.data));
  }
}

export const adminProxyCaller: () => AdminAdapter = () => AppContext.ctx.admin;
