import React from 'react';
import _ from 'lodash';
import * as R from 'ramda';

import { Button, Divider, Tabs } from 'antd';

import { createLogger } from '../helpers';
import ModulesLoader from '../modules';

const logger = createLogger('components:panes');

const { TabPane } = Tabs;

export type Pane = {
  key: string;
  linkTo: string;
  title: string;
  // composed: {
  //   component: object;
  //   state: object;
  // }
};

interface IProps {
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

class Panes extends React.Component<IProps, IState> {
  state: IState = {
    titles: {},
  };

  onEdit = (targetKey, action) => {
    const { onClose } = this.props;
    logger.log('targetKey is', targetKey, 'action is', action);
    if (action === 'remove') {
      onClose(targetKey);
    }
  };

  onTitleChange = (key, newTitle) => {
    logger.log('onTitleChange', key, newTitle);
    if (key && newTitle) {
      this.setState(R.mergeDeepRight(this.state, { titles: { [key]: newTitle } }));
    }
  };

  render() {
    const { titles } = this.state;

    const { activeKey, panes, onActive, onCloseWithout } = this.props;

    if (!activeKey) {
      return <div>^_^ - Hello kitty.</div>;
    }

    const title = titles[activeKey];

    const operations = (
      <>
        {panes && <Button icon="close-square" onClick={() => onCloseWithout()} />}
        {panes &&
          R.keys(panes).length > 1 && (
            <React.Fragment>
              <Divider type="vertical" />
              <Button icon="minus-square" onClick={() => onCloseWithout(activeKey)} />
            </React.Fragment>
          )}
      </>
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
            {/* {activeKey} - {pane.key} - {title} */}
            <ModulesLoader
              module={pane.linkTo || pane.key}
              activeKey={activeKey}
              onClose={() => this.onEdit(activeKey, 'remove')}
              basis={{ pane }}
              onTitleChange={newTitle => this.onTitleChange(activeKey, newTitle)}
            />
          </TabPane>
        ))}
      </Tabs>
    );
  }
}

export default Panes;
