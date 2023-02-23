import useLogger from '@danielwii/asuna-helper/dist/logger/hooks';

import * as _ from 'lodash';
import * as React from 'react';
import useEffectOnce from 'react-use/lib/useEffectOnce';
import { Subscription } from 'rxjs';

import { AsunaDataTable } from '../../components/AsunaDataTable';
import { Config } from '../../config';
import { ActionEvent, EventBus, EventType } from '../../core/events';
import { castModelKey } from '../../helpers/cast';
import { DebugInfo } from '../../helpers/debug';
import { extractModelNameFromPane, resolveModelInPane } from '../../helpers/models';
import { TenantHelper } from '../../helpers/tenant';
import { createLogger } from '../../logger';
import { Asuna } from '../../types';

import type { SorterResult } from 'antd/es/table/interface';
import type { Pane } from '../../components/Panes';

const logger = createLogger('<[ContentIndex]>');

export interface IProps /*extends ReduxProps*/ {
  basis: { pane: Pane };
  activeKey: string;
  // models: object;
  nextGetConfig: any;
}

interface IState {
  key: string;
  modelName: string;
  extraName?: string;
  /**
   * 不为 true 时页面不显示新建按钮
   */
  creatable: Asuna.Schema.TableColumnOptCreatable;
  editable: boolean;
  deletable: boolean;
  opts?: Asuna.Schema.TableColumnOpts<any>;
  subscription?: Subscription;
  busSubscription: Subscription;
  rowClassName?: (record: any, index: number) => string;
}

const ContentIndex: React.FC<IProps> = ({ basis, activeKey }) => {
  const { modelName, extraName } = extractModelNameFromPane(basis.pane);
  const { modelConfig, primaryKey, columnOpts } = resolveModelInPane(modelName, extraName);

  const creatableOpt = columnOpts?.creatable;
  const rowClassName = columnOpts?.rowClassName;
  let creatable = _.isFunction(creatableOpt) ? creatableOpt : modelConfig.creatable !== false && creatableOpt !== false;
  const deletable = columnOpts?.deletable !== false;
  const editable = columnOpts?.editable !== false;

  const sorter: SorterResult<any> = {
    columnKey: primaryKey,
    field: primaryKey,
    order: 'descend',
  } as any;
  const orderBy = Config.get('TABLE_DEFAULT_ORDER_BY');
  if (!_.isEmpty(orderBy) && orderBy !== 'byPrimaryKey') {
    sorter['columnKey'] = castModelKey(orderBy);
    sorter['field'] = castModelKey(orderBy);
  }

  const resolved = TenantHelper.resolveCount(modelName);
  const creatableForTenant = resolved && resolved.limit ? resolved.total < resolved.limit : creatable;

  creatable = creatableForTenant;
  const opts = columnOpts;
  const key = activeKey;

  useEffectOnce(() => {
    const subscription = EventBus.observable.subscribe({
      next: (action: ActionEvent) => {
        if (
          _.includes([EventType.MODEL_INSERT, EventType.MODEL_UPDATE], action.type) &&
          action.payload.modelName === modelName
        ) {
          logger.log('[bus-content-index]', { modelName, activeKey, action });
          // this._refresh();
          // this.setState({});
          logger.warn('maybe should refresh...');
        }
      },
    });
    return () => subscription.unsubscribe();
  });

  useLogger(
    '<[ContentIndex]>',
    { basis, activeKey },
    { modelName, extraName, modelConfig, primaryKey, columnOpts, sorter },
  );

  return (
    <>
      <AsunaDataTable
        modelName={modelName}
        extraName={extraName}
        creatable={creatable}
        editable={editable}
        deletable={deletable}
        renderActions={opts?.renderActions}
        renderHelp={opts?.renderHelp}
        expandedRowRender={opts?.expandedRowRender}
        // models={models}
        rowClassName={rowClassName}
      />
      <DebugInfo data={{ modelName, extraName, modelConfig, primaryKey, columnOpts, sorter }} divider />
    </>
  );
};

export default ContentIndex;
