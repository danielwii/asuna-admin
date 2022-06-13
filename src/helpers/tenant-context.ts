import * as _ from 'lodash';

import { TenantInfo } from '../adapters/admin.plain';

export class TenantContext {
  static tenantInfo?: TenantInfo;

  static get hasTenantRoles(): boolean {
    return !_.isEmpty(this.tenantInfo?.roles);
  }

  static modelPublishEnabled(modelName: string): boolean {
    return !!this.tenantInfo?.config?.[`publish.${modelName}`];
  }

  static enableModelPublishForCurrentUser(modelName: string): boolean {
    return this.hasTenantRoles ? this.modelPublishEnabled(modelName) : true;
  }
}
