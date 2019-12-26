import { Button, Divider, Drawer, Empty, Icon, Popconfirm, Popover, Skeleton, Timeline } from 'antd';
import { BaseButtonProps } from 'antd/es/button/button';
import { PopconfirmProps } from 'antd/es/popconfirm';
import { PopoverProps } from 'antd/lib/popover';
import * as _ from 'lodash';
import * as React from 'react';
import { useEffect, useState } from 'react';

export interface DrawerButtonProps {
  text: string;
  title?: string;
  width?: number | string;
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
  children,
  ...baseButtonProps
}) => {
  const [visible, setVisible] = useState(false);
  const [childrenDrawer, setChildrenVisible] = useState(false);

  const _showDrawer = () => setVisible(true);
  const _onClose = () => setVisible(false);
  const _showChildrenDrawer = () => setChildrenVisible(true);
  const _onChildrenDrawerClose = () => setChildrenVisible(false);

  const _renderButton = (
    <Button {...baseButtonProps} onClick={_showDrawer}>
      {text}
      <Icon type="select" />
    </Button>
  );

  return (
    <>
      {popoverProps ? <Popover {...popoverProps}>{_renderButton}</Popover> : _renderButton}
      <Drawer title={title || text} width={width ?? 520} closable={false} onClose={_onClose} visible={visible}>
        {children}
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
          <Button style={{ marginRight: 8 }} onClick={_onClose}>
            Cancel
          </Button>
        </div>
      </Drawer>
    </>
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
