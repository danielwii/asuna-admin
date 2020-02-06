/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import { Button, Divider, Drawer, Empty, Icon, Popover, Skeleton, Timeline } from 'antd';
import { BaseButtonProps } from 'antd/es/button/button';
import { PopoverProps } from 'antd/lib/popover';
import * as _ from 'lodash';
import * as React from 'react';
import { useEffect, useState } from 'react';

type RenderComponentType = React.FC<{ refreshFlag: number; openChildrenDrawer?: any }>;
type RenderChildrenComponentType = React.FC<{ item: any }>;

export interface DrawerButtonProps {
  text: React.ReactNode;
  title?: string;
  width?: number | string;
  render?: RenderComponentType;
  renderChildrenDrawer?: RenderChildrenComponentType;
}

export const DrawerButtonBuilder: React.FC<DrawerButtonProps &
  BaseButtonProps & { builder: () => React.ReactNode }> = ({ text, title, width, builder, ...baseButtonProps }) => {
  const [visible, setVisible] = useState(false);

  const _showDrawer = () => setVisible(true);
  const _onClose = () => setVisible(false);

  return (
    <>
      <Button {...baseButtonProps} onClick={_showDrawer}>
        {text}
        <Icon type="select" />
      </Button>
      <Drawer title={title || text} width={width ?? 520} closable={false} onClose={_onClose} visible={visible}>
        {builder()}
        {/*<Button type="primary" onClick={this.showChildrenDrawer}>
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
          </Drawer>*/}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            borderTop: '1px solid #e8e8e8',
            padding: '10px 16px',
            textAlign: 'right',
            left: 0,
            background: '#fff',
            borderRadius: '0 0 4px 4px',
          }}
        >
          <Button style={{ marginRight: 8 }} onClick={_onClose}>
            Cancel
          </Button>
          {/*<Button onClick={this.onClose} type="primary">
              Submit
            </Button>*/}
        </div>
      </Drawer>
    </>
  );
};

export const DrawerButton: React.FC<DrawerButtonProps &
  BaseButtonProps & { popoverProps?: PopoverProps; extraButtons?: React.ReactNode }> = ({
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
    <Button {...baseButtonProps} onClick={_showDrawer}>
      {text}
      <Icon type="select" />
    </Button>
  );
  const RenderComponent: RenderComponentType = render || ((<></>) as any);
  const RenderChildrenComponent: RenderChildrenComponentType = renderChildrenDrawer || ((<></>) as any);

  return (
    <React.Fragment>
      {popoverProps ? <Popover {...popoverProps}>{_renderButton}</Popover> : _renderButton}
      <Drawer title={title || text} width={width ?? 520} closable={false} onClose={_onClose} visible={visible}>
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
            openChildrenDrawer={item => {
              setChildrenItem(item);
              setChildrenVisible(true);
            }}
          />
        )}
        {/*<Button type="primary" onClick={this.showChildrenDrawer}>
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
          </Drawer>*/}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            borderTop: '1px solid #e8e8e8',
            padding: '10px 16px',
            textAlign: 'right',
            left: 0,
            background: '#fff',
            borderRadius: '0 0 4px 4px',
          }}
        >
          {extraButtons && (
            <>
              {extraButtons}
              <Divider type="vertical" />
            </>
          )}
          {render && (
            <>
              <Button type="primary" onClick={() => setRefreshFlag(refreshFlag + 1)}>
                刷新
              </Button>
              <Divider type="vertical" />
            </>
          )}
          <Button onClick={_onClose}>关闭</Button>
        </div>
        {renderChildrenDrawer && (
          <Drawer width={450} closable={false} onClose={_onChildrenClose} visible={childrenDrawer}>
            <RenderChildrenComponent item={childrenItem} />
          </Drawer>
        )}
      </Drawer>
    </React.Fragment>
  );
};

export interface HistoryTimelineProps {
  dataLoader: () => Promise<{ items: any[] }>;
  render: (history) => React.ReactChild;
}

export const HistoryTimeline: React.FC<HistoryTimelineProps> = ({ dataLoader, render }) => {
  const [state, setState] = useState<{ loading: boolean; fields: any[] }>({
    loading: true,
    fields: [],
  });

  useEffect(() => {
    (async () => {
      const data = await dataLoader();
      if (data) setState({ loading: false, fields: data.items });
    })();
  }, []);

  if (state.loading) return <Skeleton active />;
  if (_.isEmpty(state.fields)) return <Empty />;

  return <Timeline>{state.fields.map(render)}</Timeline>;
};
