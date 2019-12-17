import { AppContext } from '@asuna-admin/core';
import { AxiosResponse } from 'axios';
import { plainToClass } from 'class-transformer';

export interface IAdminService {
  tenantInfo(auth: { token: string | null }): Promise<AxiosResponse>;
  ensureTenant(auth: { token: string | null }): Promise<AxiosResponse>;
}

export class TenantInfo {
  config?: Partial<{
    enabled: boolean;
    bindRoles: string;
    firstModelName: string;
    firstDisplayName: string;
  }>;
  tenant?: any;
  hasTenantRoles: string[];
}

export class Tenant {}

export interface AdminAdapter {
  tenantInfo(): Promise<TenantInfo>;
  ensureTenant(): Promise<Tenant>;
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

  ensureTenant(): Promise<Tenant> {
    const auth = AppContext.fromStore('auth');
    return this.service.ensureTenant(auth).then(res => plainToClass(TenantInfo, res.data));
  }
}

export const adminProxyCaller: () => AdminAdapter = () => AppContext.ctx.admin;
