import { diff } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';
import ModulesLoader from '@asuna-admin/modules';

import { Button, Divider, Tabs } from 'antd';
import _ from 'lodash';
import * as R from 'ramda';
import React from 'react';

const logger = createLogger('components:panes');

const { TabPane } = Tabs;

export type Pane = {
  key: string;
  linkTo: string;
  title: string;
  data: {
    modelName: string;
    record: any;
  };
  component?;
  // composed: {
  //   component: object;
  //   state: object;
  // }
};

export interface IPanesProps {
  panes?: {
    [key: string]: Pane;
  };
  activeKey?: string;
  onActive: (key: string) => void;
  onClose: (key: string) => void;
  onCloseWithout: (key?: string) => void;
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

  shouldComponentUpdate(
    nextProps: Readonly<IPanesProps>,
    nextState: Readonly<IState>,
    nextContext: any,
  ): boolean {
    const propsDiff = diff(nextProps, this.props);
    const stateDiff = diff(nextState, this.state);
    logger.log('[shouldComponentUpdate]', { propsDiff, stateDiff });
    return propsDiff.isDifferent || stateDiff.isDifferent;
  }

  render() {
    const { titles } = this.state;

    const { activeKey, panes, onActive, onCloseWithout } = this.props;

    if (!activeKey) {
      return <div>welcome</div>;
    }

    const title = titles[activeKey];
    logger.log('[render]', { props: this.props, stats: this.state });

    const operations = (
      <React.Fragment>
        {panes && <Button icon="close-square" onClick={() => onCloseWithout()} />}
        {panes && R.keys(panes).length > 1 && (
          <React.Fragment>
            <Divider type="vertical" />
            <Button icon="minus-square" onClick={() => onCloseWithout(activeKey)} />
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
