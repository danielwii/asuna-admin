/** @jsxRuntime classic */

/** @jsx jsx */
import { SelectOutlined, SyncOutlined } from '@ant-design/icons';
// noinspection ES6UnusedImports
import { css, jsx } from '@emotion/react';

import useLogger from '@danielwii/asuna-helper/dist/logger/hooks';

import { Button, Divider, Drawer, Empty, Popover, Skeleton, Switch, Timeline } from 'antd';
import { TimelineItemProps } from 'antd/es/timeline/TimelineItem';
import * as _ from 'lodash';
import React, { useState } from 'react';
import useAsyncRetry from 'react-use/lib/useAsyncRetry';
import useInterval from 'react-use/lib/useInterval';
import useToggle from 'react-use/lib/useToggle';
import styled from 'styled-components';

import { createLogger } from '../../../logger';

import type { PopoverProps } from 'antd/es';
import type { BaseButtonProps } from 'antd/es/button/button';

const logger = createLogger('components:drawer-button');

type RenderComponentType = React.FC<{ refreshFlag: number; openChildrenDrawer?: any }>;
export type RenderChildrenComponentType = React.FC<{ item: any }>;

export interface DrawerButtonProps {
  text: React.ReactNode;
  title?: string;
  width?: number | string;
  render?: RenderComponentType;
  renderChildrenDrawer?: RenderChildrenComponentType;
}

export const DrawerButtonBuilder: React.FC<
  DrawerButtonProps & BaseButtonProps & { builder: () => React.ReactNode }
> = ({ text, title, width, builder, ...baseButtonProps }) => {
  const [visible, setVisible] = useState(false);

  const _showDrawer = () => setVisible(true);
  const _onClose = () => setVisible(false);

  return (
    <React.Fragment>
      <Button {...baseButtonProps} onClick={_showDrawer}>
        {text}
        <SelectOutlined />
      </Button>
      <Drawer title={title || text} width={width ?? 520} closable={false} onClose={_onClose} visible={visible}>
        {builder()}
        {/* <Button type="primary" onClick={this.showChildrenDrawer}>
          Two-level drawer
        </Button>
        <Drawer
          title="Two-level Drawer"
          width={320}
          closable={false}
          onClose={this.onChildrenDrawerClose}
          visible={this.state.childrenDrawer}
        >
          This is two-level drawer
        </Drawer> */}
        <StyledButton>
          <Button style={{ marginRight: 8 }} onClick={_onClose}>
            Cancel
          </Button>
          {/* <Button onClick={this.onClose} type="primary">
            Submit
          </Button> */}
        </StyledButton>
      </Drawer>
    </React.Fragment>
  );
};

export const DrawerButton: React.FC<
  DrawerButtonProps & BaseButtonProps & { popoverProps?: PopoverProps; extraButtons?: React.ReactNode }
> = ({
  text,
  title,
  width,
  popoverProps,
  extraButtons,
  renderChildrenDrawer,
  children,
  render,
  ...baseButtonProps
}) => {
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [visible, setVisible] = useState(false);
  const [childrenDrawer, setChildrenVisible] = useState(false);
  const [childrenItem, setChildrenItem] = useState(null);

  const _showDrawer = () => setVisible(true);
  const _onClose = () => setVisible(false);
  const _onChildrenClose = () => setChildrenVisible(false);

  const _renderButton = (
    <Button size="small" {...baseButtonProps} onClick={_showDrawer}>
      {text}
      <SelectOutlined />
    </Button>
  );
  const RenderComponent: RenderComponentType = render ?? ((<React.Fragment />) as any);
  const RenderChildrenComponent: RenderChildrenComponentType = renderChildrenDrawer ?? ((<React.Fragment />) as any);

  // useLogger('<[DrawerButton]>', { visible, childrenDrawer, childrenItem });

  return (
    <React.Fragment>
      {popoverProps ? <Popover {...popoverProps}>{_renderButton}</Popover> : _renderButton}
      {visible && (
        <Drawer title={title || text} width={width ?? 520} closable={false} onClose={_onClose} open>
          <div
            css={css`
              margin-bottom: 2rem;
            `}
          >
            {children}
          </div>
          {render && (
            <RenderComponent
              refreshFlag={refreshFlag}
              openChildrenDrawer={(item) => {
                setChildrenItem(item);
                setChildrenVisible(true);
              }}
            />
          )}
          {/* <Button type="primary" onClick={this.showChildrenDrawer}>
            Two-level drawer
          </Button>
          <Drawer
            title="Two-level Drawer"
            width={320}
            closable={false}
            onClose={this.onChildrenDrawerClose}
            visible={this.state.childrenDrawer}
          >
            This is two-level drawer
          </Drawer> */}
          <StyledButton>
            {extraButtons && (
              <React.Fragment>
                {extraButtons}
                <Divider type="vertical" />
              </React.Fragment>
            )}
            {render && (
              <React.Fragment>
                <Button type="primary" onClick={() => setRefreshFlag(refreshFlag + 1)}>
                  刷新
                </Button>
                <Divider type="vertical" />
              </React.Fragment>
            )}
            <Button onClick={_onClose}>关闭</Button>
            &nbsp;
          </StyledButton>
          {renderChildrenDrawer && (
            <Drawer width={520} closable={false} onClose={_onChildrenClose} open={childrenDrawer}>
              <RenderChildrenComponent item={childrenItem} />
            </Drawer>
          )}
        </Drawer>
      )}
    </React.Fragment>
  );
};

export const HistoryTimeline: React.FC<{
  dataLoader: () => Promise<{ items: any[] }>;
  render: (item: any) => TimelineItemProps;
  autoRefresh?: boolean;
}> = ({ dataLoader, render, autoRefresh }) => {
  const [enabled, toggle] = useToggle(autoRefresh ?? false);
  const state = useAsyncRetry(async () => await dataLoader());

  useInterval(() => state.retry(), enabled ? 5000 : null);
  useLogger('<[HistoryTimeline]>', state, { autoRefresh, isEmpty: _.isEmpty(state.value?.items) });

  if (!state.value && state.loading) return <Skeleton active />;
  if (_.isEmpty(state.value?.items)) return <Empty />;

  const items = state.value!.items.map(render);

  return (
    <>
      {autoRefresh && (
        <div>
          <div>
            <Switch
              checkedChildren={
                <div>
                  <SyncOutlined spin={enabled} /> in 5s
                </div>
              }
              unCheckedChildren={<span>自动刷新</span>}
              defaultChecked={enabled}
              onClick={toggle}
            />{' '}
            {!enabled && (
              <Button size="small" type="primary" onClick={() => state.retry()} loading={state.loading}>
                刷新
              </Button>
            )}
          </div>
          <Divider style={{ margin: '0.5rem 0' }} dashed />
        </div>
      )}
      <Timeline mode="left" items={items} />
    </>
  );
};

const StyledButton = styled.div`
  position: absolute;
  bottom: 0;
  width: 100%;
  border-top: 1px solid #e8e8e8;
  padding: 10px 0;
  text-align: right;
  left: 0;
  background: #fff;
  border-radius: 0 0 4px 4px;
`;
