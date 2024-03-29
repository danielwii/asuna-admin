import { CloseCircleOutlined, CloseSquareOutlined, MinusSquareOutlined } from '@ant-design/icons';
import { Tooltip } from '@mui/material';

import { Button, Divider, Tabs } from 'antd';
import * as _ from 'lodash';
import * as R from 'ramda';
import * as React from 'react';
import { useMemo } from 'react';
import { Async } from 'react-async';
import { FoldingCube } from 'styled-spinkit';

import { DebugInfo } from '../helpers/debug';
import { TenantHelper } from '../helpers/tenant';
import { createLogger } from '../logger';
import ModulesLoader from '../modules';
import { TenantWelcome } from '../tenant/Welcome';
import { ErrorInfo } from './base/error';

const logger = createLogger('components:panes');

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
  const ExtraContent = useMemo(
    () => (
      <React.Fragment>
        {panes && (
          <Tooltip title="关闭全部">
            <Button icon={<CloseSquareOutlined />} onClick={() => onCloseWithout()} />
          </Tooltip>
        )}
        {R.keys(panes).length > 0 && (
          <React.Fragment>
            <Divider type="vertical" />
            <Tooltip title="关闭其他">
              <Button icon={<MinusSquareOutlined />} onClick={() => onCloseWithout(activeKey)} />
            </Tooltip>
            <Divider type="vertical" />
            <Tooltip title="关闭当前标签页">
              <CloseCircleOutlined onClick={() => onCloseCurrent(activeKey)} />
            </Tooltip>
          </React.Fragment>
        )}
      </React.Fragment>
    ),
    [R.keys(panes).length],
  );
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

  // useLogger('<[PanesView]>', { 'panes.length': R.keys(panes).length });

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

  return (
    <Tabs
      hideAdd
      tabBarExtraContent={ExtraContent}
      onChange={onActive}
      activeKey={activeKey}
      type="editable-card"
      onEdit={func.onEdit}
      items={_.map(panes, (pane: Pane) => ({
        key: pane.key,
        label: pane.title,
        children: (
          <ModulesLoader
            module={pane.linkTo || (pane.key as any)}
            activeKey={activeKey}
            onClose={() => func.onEdit(activeKey, 'remove')}
            basis={{ pane }}
            onTitleChange={(newTitle) => func.onTitleChange(activeKey, newTitle)}
            component={pane.component}
          />
        ),
      }))}
    />
  );
};
