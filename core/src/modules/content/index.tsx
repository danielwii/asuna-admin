import { AsunaDataTable, Pane } from '@asuna-admin/components';
import { Config } from '@asuna-admin/config';
import { ActionEvent, AppContext, EventBus, EventType } from '@asuna-admin/core';
import { castModelKey, diff, extractModelNameFromPane, resolveModelInPane } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';
import { RootState } from '@asuna-admin/store';
import { Asuna } from '@asuna-admin/types';
import { SorterResult } from 'antd/es/table';
import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import { Subscription } from 'rxjs';

const logger = createLogger('modules:content:index');

interface IProps extends ReduxProps {
  basis: { pane: Pane };
  activeKey: string;
  models: object;
  nextGetConfig: any;
}

interface IState {
  key: string;
  modelName: string;
  /**
   * 不为 true 时页面不显示新建按钮
   */
  creatable: Asuna.Schema.TableColumnOptCreatable;
  editable: boolean;
  deletable: boolean;
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
    const { modelConfig, primaryKey, tableColumnOpts } = resolveModelInPane(modelName, extraName);

    const creatableOpt = tableColumnOpts?.creatable;
    const rowClassName = tableColumnOpts?.rowClassName;
    const creatable = _.isFunction(creatableOpt)
      ? creatableOpt
      : modelConfig.creatable !== false && creatableOpt !== false;
    const deletable = tableColumnOpts?.deletable !== false;
    const editable = tableColumnOpts?.editable !== false;

    logger.debug(
      '[constructor]',
      { modelConfig, modelName, primaryKey, tableColumnOpts },
      { creatable, editable, deletable },
    );
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
    this.state = {
      modelName,
      creatable,
      editable,
      deletable,
      rowClassName,
      key: activeKey,
      subscription: AppContext.subject.subscribe({
        next: action => {
          // logger.log('[observer-content-index]', { modelName, activeKey, action });
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
    const { modelName, creatable, editable, deletable, rowClassName } = this.state;

    const { models } = this.props;

    return (
      <AsunaDataTable
        creatable={creatable}
        editable={editable}
        deletable={deletable}
        modelName={modelName}
        models={models}
        rowClassName={rowClassName}
      />
    );
  }
}

const mapStateToProps = (state: RootState): any => state.content;

export default connect(mapStateToProps)(ContentIndex);
