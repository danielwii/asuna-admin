import { Button, Drawer, Icon, Timeline } from 'antd';
import { useEffect, useState } from 'react';
import * as React from 'react';

export interface DrawerButtonProps {
  text: string;
  title?: string;
}

export class DrawerButton extends React.Component<DrawerButtonProps> {
  state = { visible: false, childrenDrawer: false };

  showDrawer = () => {
    this.setState({ visible: true });
  };

  onClose = () => {
    this.setState({ visible: false });
  };

  showChildrenDrawer = () => {
    this.setState({ childrenDrawer: true });
  };

  onChildrenDrawerClose = () => {
    this.setState({ childrenDrawer: false });
  };

  render() {
    const { text, title, children } = this.props;
    return (
      <>
        <Button size="small" type="dashed" onClick={this.showDrawer}>
          {text}
          <Icon type="select" />
        </Button>
        <Drawer
          title={title || text}
          width={520}
          closable={false}
          onClose={this.onClose}
          visible={this.state.visible}
        >
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
            <Button
              style={{
                marginRight: 8,
              }}
              onClick={this.onClose}
            >
              Cancel
            </Button>
            {/*<Button onClick={this.onClose} type="primary">
              Submit
            </Button>*/}
          </div>
        </Drawer>
      </>
    );
  }
}

export interface HistoryTimelineProps {
  dataLoader: () => Promise<{ items: any[] }>;
  render: (history) => React.ReactChild;
}

export function HistoryTimeline(props: HistoryTimelineProps) {
  const { dataLoader, render } = props;
  const [state, setState] = useState<{ fields: any[] }>({ fields: [] });

  useEffect(() => {
    (async () => {
      const data = await dataLoader();
      setState({ fields: data.items });
    })();
  }, []);

  return <Timeline>{state.fields.map(render)}</Timeline>;
}
