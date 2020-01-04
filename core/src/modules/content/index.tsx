import { AsunaDataTable, Pane } from '@asuna-admin/components';
import { Config } from '@asuna-admin/config';
import { ActionEvent, AppContext, EventBus, EventType } from '@asuna-admin/core';
import {
  castModelKey,
  DebugInfo,
  diff,
  extractModelNameFromPane,
  resolveModelInPane,
  TenantHelper,
} from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';
import { Asuna } from '@asuna-admin/types';
import { SorterResult } from 'antd/es/table';
import * as _ from 'lodash';
import * as React from 'react';
import { Subscription } from 'rxjs';

const logger = createLogger('modules:content:index');

interface IProps extends ReduxProps {
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
  subscription: Subscription;
  busSubscription: Subscription;
  rowClassName?: (record: any, index: number) => string;
}

class ContentIndex extends React.Component<IProps, IState> {
  constructor(props) {
    super(props);

    const { basis, activeKey } = this.props;

    logger.debug('[constructor]', { basis });

    const { modelName, extraName } = extractModelNameFromPane(basis.pane);
    const { modelConfig, primaryKey, columnOpts } = resolveModelInPane(modelName, extraName);

    const creatableOpt = columnOpts?.creatable;
    const rowClassName = columnOpts?.rowClassName;
    const creatable = _.isFunction(creatableOpt)
      ? creatableOpt
      : modelConfig.creatable !== false && creatableOpt !== false;
    const deletable = columnOpts?.deletable !== false;
    const editable = columnOpts?.editable !== false;

    logger.debug('[constructor]', { modelConfig, modelName, primaryKey, columnOpts, creatable });
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

    this.state = {
      modelName,
      extraName,
      creatable: creatableForTenant,
      editable,
      deletable,
      opts: columnOpts,
      rowClassName,
      key: activeKey,
      subscription: AppContext.subject.subscribe({
        next: action => {
          logger.debug('[observer-content-index]', { modelName, activeKey, action });
        },
      }),
      busSubscription: EventBus.observable.subscribe({
        next: (action: ActionEvent) => {
          if (
            _.includes([EventType.MODEL_INSERT, EventType.MODEL_UPDATE], action.type) &&
            action.payload.modelName === modelName
          ) {
            logger.log('[bus-content-index]', { modelName, activeKey, action });
            // this._refresh();
            this.setState({});
          }
        },
      }),
    };
  }

  componentWillUnmount() {
    logger.log('[componentWillUnmount]', 'destroy subscriptions');
    this.state.subscription.unsubscribe();
    this.state.busSubscription.unsubscribe();
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    logger.debug('[shouldComponentUpdate]', { nextProps, nextState, nextContext });
    const { key } = this.state;
    const { activeKey } = nextProps;
    const samePane = key === activeKey;
    const propsDiff = diff(this.props, nextProps);
    const stateDiff = diff(this.state, nextState);
    const shouldUpdate = samePane && (propsDiff.isDifferent || stateDiff.isDifferent);
    logger.debug('[shouldComponentUpdate]', { key, activeKey, samePane, shouldUpdate, propsDiff, stateDiff });
    return shouldUpdate;
  }

  render() {
    const { modelName, extraName, creatable, editable, deletable, rowClassName, opts } = this.state;

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
          // models={models}
          rowClassName={rowClassName}
        />
        <DebugInfo data={{ props: this.props, state: this.state }} divider />
      </>
    );
  }
}

export default ContentIndex;
