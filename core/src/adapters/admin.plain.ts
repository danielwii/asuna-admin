import { Asuna, Json } from '@asuna-admin/types';

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
