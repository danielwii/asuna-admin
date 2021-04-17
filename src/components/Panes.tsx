import { CloseCircleOutlined, CloseSquareOutlined, MinusSquareOutlined } from '@ant-design/icons';
import { Tooltip } from '@material-ui/core';

import { Button, Divider, Tabs } from 'antd';
import * as _ from 'lodash';
import * as R from 'ramda';
import * as React from 'react';
import { Async } from 'react-async';
import { FoldingCube } from 'styled-spinkit';

import { ErrorInfo } from '../components';
import { diff, TenantHelper } from '../helpers';
import { DebugInfo } from '../helpers/debug';
import { createLogger } from '../logger';
import ModulesLoader from '../modules';
import { TenantWelcome } from '../tenant';

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

export const PanesView: React.FC<IPanesProps> = ({
  onClose,
  activeKey,
  onActive,
  onCloseCurrent,
  onCloseWithout,
  panes,
}) => {
  const [state, setState] = React.useState<IState>({ titles: {} });
  const func = {
    onEdit: (targetKey, action) => {
      logger.log('[onEdit]', { targetKey, action });
      if (action === 'remove') {
        onClose(targetKey);
      }
    },
    onTitleChange: (key, newTitle) => {
      logger.log('[onTitleChange]', { key, newTitle });
      if (key && newTitle) {
        setState(R.mergeDeepRight(state, { titles: { [key]: newTitle } }));
      }
    },
  };

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

  const title = state.titles[activeKey];

  const operations = (
    <React.Fragment>
      {panes && (
        <Tooltip title="关闭全部">
          <Button icon={<CloseSquareOutlined />} onClick={() => onCloseWithout()} />
        </Tooltip>
      )}
      {panes && R.keys(panes).length > 0 && (
        <React.Fragment>
          <Divider type="vertical" />
          <Tooltip title="关闭其他">
            <Button icon={<MinusSquareOutlined />} onClick={() => onCloseWithout(activeKey)} />
          </Tooltip>
          {/*
            <Dropdown
              overlay={
                <Menu onClick={(param: ClickParam) => onCloseWithout()}>
                  <Menu.Item key="1">关闭其他</Menu.Item>
                  <Menu.Item key="2">关闭左侧全部</Menu.Item>
                  <Menu.Item key="3">关闭右侧全部</Menu.Item>
                </Menu>
              }
            >
              <Button>
                <MinusSquareOutlined />
              </Button>
            </Dropdown>
*/}

          <Divider type="vertical" />
          <Tooltip title="关闭当前标签页">
            <CloseCircleOutlined onClick={() => onCloseCurrent(activeKey)} />
          </Tooltip>
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
      onEdit={func.onEdit}
    >
      {_.map(panes, (pane: Pane) => (
        <TabPane tab={pane.title} key={pane.key}>
          {/*{activeKey} - {pane.key} - {title}*/}
          {/*<pre>{util.inspect(pane)}</pre>*/}
          <ModulesLoader
            module={pane.linkTo || pane.key}
            activeKey={activeKey}
            onClose={() => func.onEdit(activeKey, 'remove')}
            basis={{ pane }}
            onTitleChange={(newTitle) => func.onTitleChange(activeKey, newTitle)}
            component={pane.component}
          />
        </TabPane>
      ))}
    </Tabs>
  );
};

/*
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
        {panes && (
          <Tooltip title="关闭全部">
            <Button icon={<CloseSquareOutlined />} onClick={() => onCloseWithout()} />
          </Tooltip>
        )}
        {panes && R.keys(panes).length > 0 && (
          <React.Fragment>
            <Divider type="vertical" />
            <Tooltip title="关闭其他">
              <Button icon={<MinusSquareOutlined />} onClick={() => onCloseWithout(activeKey)} />
            </Tooltip>
            {/!*
            <Dropdown
              overlay={
                <Menu onClick={(param: ClickParam) => onCloseWithout()}>
                  <Menu.Item key="1">关闭其他</Menu.Item>
                  <Menu.Item key="2">关闭左侧全部</Menu.Item>
                  <Menu.Item key="3">关闭右侧全部</Menu.Item>
                </Menu>
              }
            >
              <Button>
                <MinusSquareOutlined />
              </Button>
            </Dropdown>
*!/}

            <Divider type="vertical" />
            <Tooltip title="关闭当前标签页">
              <CloseCircleOutlined onClick={() => onCloseCurrent(activeKey)} />
            </Tooltip>
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
            {/!*{activeKey} - {pane.key} - {title}*!/}
            {/!*<pre>{util.inspect(pane)}</pre>*!/}
            <ModulesLoader
              module={pane.linkTo || pane.key}
              activeKey={activeKey}
              onClose={() => this.onEdit(activeKey, 'remove')}
              basis={{ pane }}
              onTitleChange={(newTitle) => this.onTitleChange(activeKey, newTitle)}
              component={pane.component}
            />
          </TabPane>
        ))}
      </Tabs>
    );
  }
}
*/
