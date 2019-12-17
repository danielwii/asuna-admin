import { adminProxyCaller, TenantInfo } from '@asuna-admin/adapters';
import { AppContext } from '@asuna-admin/core';
import { diff } from '@asuna-admin/helpers/index';
import { createLogger } from '@asuna-admin/logger';
import { panesActions } from '@asuna-admin/store';
import * as Rx from 'rxjs';

const logger = createLogger('helpers:tenant');

export class TenantHelper {
  static readonly subject = new Rx.ReplaySubject<TenantInfo>(1);
  static tenantInfo: TenantInfo;

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
}
