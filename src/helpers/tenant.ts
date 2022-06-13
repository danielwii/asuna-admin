import * as _ from 'lodash';
import * as fp from 'lodash/fp';
import * as Rx from 'rxjs';

import { TenantInfo } from '../adapters/admin.plain';
import { AppContext } from '../core/context';
import { createLogger } from '../logger';
import { TenantContext } from './tenant-context';
import { diff } from './utils';

import type { RelationColumnProps } from './columns/types';

const logger = createLogger('helpers:tenant');

export class TenantHelper {
  static readonly subject = new Rx.ReplaySubject<TenantInfo>(1);

  static async reloadInfo(): Promise<TenantInfo> {
    const info = await AppContext.ctx.admin.tenantInfo();
    if (diff(TenantContext.tenantInfo, info).isDifferent) {
      logger.log('info', { info, saved: TenantContext.tenantInfo, diff: diff(TenantContext.tenantInfo, info) });
      this.subject.next(info);
      TenantContext.tenantInfo = info;
    }
    return info;
  }

  static authorized(tenantInfo?: TenantInfo): boolean {
    const boundTenant = tenantInfo?.tenant;
    const hasTenantRoles = !_.isEmpty(tenantInfo?.roles);
    logger.log('authorized', { boundTenant, hasTenantRoles, isPublished: tenantInfo?.tenant?.isPublished });
    return (boundTenant && hasTenantRoles && tenantInfo?.tenant?.isPublished) ?? false;
  }

  static wrapModelColumnProps(modelName: string, columns: RelationColumnProps[]): RelationColumnProps[] {
    logger.log('filterModelColumnProps', TenantContext.tenantInfo, { modelName, columns });
    if (!_.keys(TenantContext.tenantInfo?.entities).includes(modelName)) return columns;

    const isPublishedColumn = columns.find((column) => column.key === 'isPublished');
    if (TenantContext.hasTenantRoles && !TenantContext.modelPublishEnabled(modelName)) {
      // isPublishedColumn
      logger.log('isPublishedColumn', isPublishedColumn);
    }
    return columns;
  }

  static wrapFields(modelName: string, fields: any[]): void {
    if (!TenantContext.hasTenantRoles) return;
    if (!TenantContext.enableModelPublishForCurrentUser(modelName)) {
      const field = _.find(fields, (field) => field.name === 'isPublished');
      // const primaryKey = AppContext.adapters.models.getPrimaryKey(modelName);
      // const id = fields[primaryKey];
      // field && _.set(field, 'options.accessible', id.value ? 'readonly' : 'hidden');
      field && _.set(field, 'options.accessible', 'hidden');
    }

    if (TenantContext.tenantInfo?.config?.firstModelBind && TenantContext.tenantInfo?.config?.firstModelName) {
      const field = _.find(fields, (field) => {
        // if (_.get(field, 'options.selectable') === TenantContext.tenantInfo?.config?.firstModelName)
        //   console.log('check', field, _.get(field, 'options.selectable'), TenantContext.tenantInfo?.config?.firstModelName);
        return _.get(field, 'options.selectable') === TenantContext.tenantInfo?.config?.firstModelName;
      });
      if (field) delete fields[field.name];
    }
  }

  static resolveCount(key: string): { total: number; published?: number; limit: number } {
    const limit = TenantContext.tenantInfo?.config?.[`limit.${key}`];
    const recordCount = TenantContext.tenantInfo?.recordCounts?.[key] ?? { total: 0 };
    return { ...recordCount, limit };
  }

  static async resolveBindModel<T = JSON>(): Promise<T | undefined> {
    if (TenantContext.tenantInfo?.config?.firstModelBind && TenantContext.tenantInfo?.config?.firstModelName) {
      return await AppContext.ctx.models
        .loadModels2(TenantContext.tenantInfo?.config?.firstModelName)
        .then(fp.get('items[0]'));
    }
  }
}
