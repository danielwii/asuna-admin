import type { Json } from '@danielwii/asuna-shared';
import type { Asuna } from '../types';

export type StateMachine = {
  key: string;
  stateKey: string;
  actionKey: string;
  defaultState: string;
  actions: { type: string; from: string; to: string }[];
};

export class StateMachines {
  [key: string]: StateMachine;
}

export class TenantInfo {
  config?: Partial<{
    enabled: boolean;
    activeByDefault: boolean;
    bindRoles: string;
    firstModelBind: boolean;
    firstModelField: string;
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
  createdAt: string;
  updatedAt: string;
}
