import { plainToInstance } from 'class-transformer';
import _ from 'lodash';
import * as fp from 'lodash/fp';

import { AppContext } from '../core/context';
import { Draft, StateMachines, Tenant, TenantInfo } from './admin.plain';

import type { AxiosResponse } from 'axios';
import type { Json } from '../types';

export interface IAdminService {
  stateMachines(auth: { token: string | null }): Promise<AxiosResponse>;
  tenantInfo(auth: { token: string | null }): Promise<AxiosResponse>;
  registerTenant<T>(
    auth: { token: string | null },
    data: { name: string; description?: string; payload?: T },
  ): Promise<AxiosResponse>;
  createDraft(
    auth: { token: string | null },
    data: { content: Json; type: string; refId?: string },
  ): Promise<AxiosResponse>;
  getDrafts(auth: { token: string | null }, params: { type: string; refId: string }): Promise<AxiosResponse>;
  publishDraft(auth: { token: string | null }, params: { id: string }): Promise<AxiosResponse>;
  addFeedbackReply(
    auth: { token: string | null },
    params: { id: number },
    data: { images?: string[]; description: string },
  ): Promise<AxiosResponse>;
}

export interface AdminAdapter {
  stateMachines(): Promise<StateMachines>;
  tenantInfo(): Promise<TenantInfo>;
  registerTenant<T = any>(data: { name: string; description?: string; payload?: T }): Promise<Tenant>;
  createDraft(data: { content: Json; type: string; refId?: string | number }): Promise<Draft>;
  getDrafts(params: { type: string; refId: string | number }): Promise<Draft[]>;
  publishDraft(params: { id: string }): Promise<void>;
  addFeedbackReply(params: { id: number }, data: { images?: string[]; description: string }): Promise<void>;
}

export class AdminAdapterImpl implements AdminAdapter {
  constructor(private readonly service: IAdminService) {}

  stateMachines = (): Promise<StateMachines> =>
    AppContext.withAuth((auth) =>
      this.service.stateMachines(auth).then((res) => plainToInstance(StateMachines, res.data)),
    );

  tenantInfo = (): Promise<TenantInfo> =>
    AppContext.withAuth((auth) => this.service.tenantInfo(auth).then((res) => plainToInstance(TenantInfo, res.data)));

  registerTenant = <T>(data: { name: string; description?: string; payload: T }): Promise<Tenant> =>
    AppContext.withAuth((auth) =>
      this.service.registerTenant(auth, data).then((res) => plainToInstance(Tenant, res.data)),
    );

  createDraft = (data: { content: Json; type: string; refId?: string }): Promise<Draft> =>
    AppContext.withAuth((auth) => this.service.createDraft(auth, data).then((res) => plainToInstance(Draft, res.data)));

  getDrafts = (params: { type: string; refId: string }): Promise<Draft[]> =>
    AppContext.withAuth((auth) =>
      this.service.getDrafts(auth, params).then((res) => _.map(res.data, (item) => plainToInstance(Draft, item))),
    );

  publishDraft = (params: { id: string }): Promise<void> =>
    AppContext.withAuth((auth) => this.service.publishDraft(auth, params).then(fp.get('data')));

  addFeedbackReply = (params: { id: number }, data: { images?: string[]; description: string }): Promise<any> =>
    AppContext.withAuth((auth) => this.service.addFeedbackReply(auth, params, data));
}

export const adminProxyCaller: () => AdminAdapter = () => AppContext.ctx.admin;
