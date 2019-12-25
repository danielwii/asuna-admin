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
        title: `new - ${modelName}`,
        linkTo: 'content::upsert',
      }),
    );
  }

  static authorized(tenantInfo?: TenantInfo): boolean {
    const boundTenant = tenantInfo?.tenant;
    const hasTenantRoles = !_.isEmpty(tenantInfo?.roles);
    return (boundTenant && hasTenantRoles && tenantInfo?.tenant?.isPublished) ?? false;
  }

  static enableModelPublish(modelName: string): boolean {
    return this.hasTenantRoles ? this.modelPublishEnabled(modelName) : true;
  }

  static filterModelColumnProps(modelName: string, columns: RelationColumnProps[]): RelationColumnProps[] {
    console.log('filterModelColumnProps', this.tenantInfo, { modelName, columns });
    if (!_.keys(this.tenantInfo?.entities).includes(modelName)) return columns;

    const isPublishedColumn = columns.find(column => column.key === 'isPublished');
    if (this.hasTenantRoles && !this.modelPublishEnabled(modelName)) {
      // isPublishedColumn
      console.log('isPublishedColumn', isPublishedColumn);
    }
    return columns;
  }
}
