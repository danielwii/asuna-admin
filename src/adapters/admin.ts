import { plainToInstance } from 'class-transformer';
import _ from 'lodash';
import * as fp from 'lodash/fp';

import { Draft, StateMachines, Tenant, TenantInfo } from './admin.plain';

import type { AxiosResponse } from 'axios';
import type { Json } from '../types';

export interface IAdminService {
  // stateMachines(): Promise<AxiosResponse>;
  tenantInfo(): Promise<AxiosResponse>;
  registerTenant<T>(data: { name: string; description?: string; payload?: T }): Promise<AxiosResponse>;
  createDraft(data: { content: Json; type: string; refId?: string }): Promise<AxiosResponse>;
  getDrafts(params: { type: string; refId: string }): Promise<AxiosResponse>;
  publishDraft(params: { id: string }): Promise<AxiosResponse>;
  addFeedbackReply(params: { id: number }, data: { images?: string[]; description: string }): Promise<AxiosResponse>;
}

export interface AdminAdapter {
  // stateMachines(): Promise<StateMachines>;
  tenantInfo(): Promise<TenantInfo>;
  registerTenant<T = any>(data: { name: string; description?: string; payload?: T }): Promise<Tenant>;
  createDraft(data: { content: Json; type: string; refId?: string | number }): Promise<Draft>;
  getDrafts(params: { type: string; refId: string | number }): Promise<Draft[]>;
  publishDraft(params: { id: string }): Promise<void>;
  addFeedbackReply(params: { id: number }, data: { images?: string[]; description: string }): Promise<void>;
}

export class AdminAdapterImpl implements AdminAdapter {
  constructor(private readonly service: IAdminService) {}

  /*
  stateMachines = (): Promise<StateMachines> =>
    this.service.stateMachines().then((res) => plainToInstance(StateMachines, res.data));*/

  tenantInfo = (): Promise<TenantInfo> =>
    this.service.tenantInfo().then((res) => plainToInstance(TenantInfo, res.data));

  registerTenant = <T>(data: { name: string; description?: string; payload: T }): Promise<Tenant> =>
    this.service.registerTenant(data).then((res) => plainToInstance(Tenant, res.data));

  createDraft = (data: { content: Json; type: string; refId?: string }): Promise<Draft> =>
    this.service.createDraft(data).then((res) => plainToInstance(Draft, res.data));

  getDrafts = (params: { type: string; refId: string }): Promise<Draft[]> =>
    this.service.getDrafts(params).then((res) => _.map(res.data, (item) => plainToInstance(Draft, item)));

  publishDraft = (params: { id: string }): Promise<void> => this.service.publishDraft(params).then(fp.get('data'));

  addFeedbackReply = (params: { id: number }, data: { images?: string[]; description: string }): Promise<any> =>
    this.service.addFeedbackReply(params, data);
}

// export const adminProxyCaller: () => AdminAdapter = () => AppContext.ctx.admin;
