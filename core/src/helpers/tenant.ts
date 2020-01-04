import { adminProxyCaller, TenantInfo } from '@asuna-admin/adapters';
import { AppContext } from '@asuna-admin/core';
import { diff, RelationColumnProps } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';
import { panesActions } from '@asuna-admin/store';
import * as _ from 'lodash';
import * as Rx from 'rxjs';

const logger = createLogger('helpers:tenant');

export class TenantHelper {
  static readonly subject = new Rx.ReplaySubject<TenantInfo>(1);
  static tenantInfo?: TenantInfo;

  static get hasTenantRoles(): boolean {
    return !_.isEmpty(this.tenantInfo?.roles);
  }

  static modelPublishEnabled(modelName: string): boolean {
    return !!this.tenantInfo?.config?.[`publish.${modelName}`];
  }

  static async reloadInfo(): Promise<TenantInfo> {
    const info = await adminProxyCaller().tenantInfo();
    if (diff(this.tenantInfo, info).isDifferent) {
      logger.log('info', { info, saved: this.tenantInfo, diff: diff(this.tenantInfo, info) });
      this.subject.next(info);
      this.tenantInfo = info;
    }
    return info;
  }

  static openCreatePane(modelName: string): void {
    AppContext.dispatch(
      panesActions.open({
        key: `content::upsert::${modelName}::${Date.now()}`,
        title: `新建 - ${modelName}`,
        linkTo: 'content::upsert',
      }),
    );
  }

  static authorized(tenantInfo?: TenantInfo): boolean {
    const boundTenant = tenantInfo?.tenant;
    const hasTenantRoles = !_.isEmpty(tenantInfo?.roles);
    return (boundTenant && hasTenantRoles && tenantInfo?.tenant?.isPublished) ?? false;
  }

  static enableModelPublishForCurrentUser(modelName: string): boolean {
    return this.hasTenantRoles ? this.modelPublishEnabled(modelName) : true;
  }

  static wrapModelColumnProps(modelName: string, columns: RelationColumnProps[]): RelationColumnProps[] {
    console.log('filterModelColumnProps', this.tenantInfo, { modelName, columns });
    if (!_.keys(this.tenantInfo?.entities).includes(modelName)) return columns;

    const isPublishedColumn = columns.find(column => column.key === 'isPublished');
    if (this.hasTenantRoles && !this.modelPublishEnabled(modelName)) {
      // isPublishedColumn
      console.log('isPublishedColumn', isPublishedColumn);
    }
    return columns;
  }

  static wrapFields(modelName: string, fields: any[]): void {
    if (!this.enableModelPublishForCurrentUser(modelName)) {
      const field = _.find(fields, field => field.name === 'isPublished');
      // const primaryKey = AppContext.adapters.models.getPrimaryKey(modelName);
      // const id = fields[primaryKey];
      // field && _.set(field, 'options.accessible', id.value ? 'readonly' : 'hidden');
      field && _.set(field, 'options.accessible', 'hidden');
    }

    if (this.tenantInfo?.config?.firstModelBind && this.tenantInfo?.config?.firstModelName) {
      const field = _.find(fields, field => {
        // if (_.get(field, 'options.selectable') === this.tenantInfo?.config?.firstModelName)
        //   console.log('check', field, _.get(field, 'options.selectable'), this.tenantInfo?.config?.firstModelName);
        return _.get(field, 'options.selectable') === this.tenantInfo?.config?.firstModelName;
      });
      if (field) delete fields[field.name];
    }
  }

  static resolveCount(key: string): { total: number; published?: number; limit: number } {
    const limit = this.tenantInfo?.config?.[`limit.${key}`];
    const recordCount = this.tenantInfo?.recordCounts?.[key] ?? { total: 0 };
    return { ...recordCount, limit };
  }
}
