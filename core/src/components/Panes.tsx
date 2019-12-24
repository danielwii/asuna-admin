import { ErrorInfo } from '@asuna-admin/components';
import { diff, TenantHelper } from '@asuna-admin/helpers';
import { DebugInfo } from '@asuna-admin/helpers/debug';
import { createLogger } from '@asuna-admin/logger';
import ModulesLoader from '@asuna-admin/modules';
import { TenantWelcome } from '@asuna-admin/tenant';

import { Button, Divider, Tabs } from 'antd';
import * as _ from 'lodash';
import * as R from 'ramda';
import * as React from 'react';
import { Async } from 'react-async';
import { FoldingCube } from 'styled-spinkit';

const logger = createLogger('components:panes');

const { TabPane } = Tabs;

export type Pane = {
  key: string;
  linkTo: string;
  title: string;
  data: { modelName: string; record: any };
  component?;
  // composed: {
  //   component: object;
  //   state: object;
  // }
};

export interface IPanesProps {
  panes?: { [key: string]: Pane };
  activeKey?: string;
  onActive: (key: string) => void;
  onClose: (key: string) => void;
  onCloseWithout: (key?: string) => void;
  onCloseCurrent: (key?: string) => void;
}

interface IState {
  titles: object;
}

export class Panes extends React.Component<IPanesProps, IState> {
  state: IState = {
    titles: {},
  };

  onEdit = (targetKey, action) => {
    const { onClose } = this.props;
    logger.log('[onEdit]', { targetKey, action });
    if (action === 'remove') {
      onClose(targetKey);
    }
  };

  onTitleChange = (key, newTitle) => {
    logger.log('[onTitleChange]', { key, newTitle });
    if (key && newTitle) {
      this.setState(R.mergeDeepRight(this.state, { titles: { [key]: newTitle } }));
    }
  };

  shouldComponentUpdate(nextProps: Readonly<IPanesProps>, nextState: Readonly<IState>, nextContext: any): boolean {
    const propsDiff = diff(nextProps, this.props);
    const stateDiff = diff(nextState, this.state);
    logger.log('[shouldComponentUpdate]', { propsDiff, stateDiff });
    return propsDiff.isDifferent || stateDiff.isDifferent;
  }

  render() {
    const { titles } = this.state;

    const { activeKey, panes, onActive, onCloseWithout, onCloseCurrent } = this.props;

    if (!activeKey) {
      return (
        <Async promise={TenantHelper.reloadInfo()}>
          {({ data, error, isPending }) => {
            if (isPending) return <FoldingCube />;
            if (error) return <ErrorInfo>Something went wrong: {error.message}</ErrorInfo>;
            if (data?.config?.enabled && !_.isEmpty(data?.roles)) return <TenantWelcome />;
            return (
              <div>
                Welcome
                <DebugInfo data={data} divider />
              </div>
            );
          }}
        </Async>
      );
    }

    const title = titles[activeKey];
    logger.log('[render]', { props: this.props, stats: this.state });

    const operations = (
      <React.Fragment>
        {panes && <Button icon="close-square" onClick={() => onCloseWithout()} />}
        {panes && R.keys(panes).length > 0 && (
          <React.Fragment>
            <Divider type="vertical" />
            <Button icon="minus-square" onClick={() => onCloseWithout(activeKey)} />
            <Divider type="vertical" />
            <Button onClick={() => onCloseCurrent(activeKey)}>Close Current</Button>
          </React.Fragment>
        )}
      </React.Fragment>
    );

    return (
      <Tabs
        hideAdd
        tabBarExtraContent={operations}
        onChange={onActive}
        activeKey={activeKey}
        type="editable-card"
        onEdit={this.onEdit}
      >
        {_.map(panes, (pane: Pane) => (
          <TabPane tab={pane.title} key={pane.key}>
            {/*{activeKey} - {pane.key} - {title}*/}
            {/*<pre>{util.inspect(pane)}</pre>*/}
            <ModulesLoader
              module={pane.linkTo || pane.key}
              activeKey={activeKey}
              onClose={() => this.onEdit(activeKey, 'remove')}
              basis={{ pane }}
              onTitleChange={newTitle => this.onTitleChange(activeKey, newTitle)}
              component={pane.component}
            />
          </TabPane>
        ))}
      </Tabs>
    );
  }
}
