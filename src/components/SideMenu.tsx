import React from 'react';
import _ from 'lodash';

import { Layout, Menu } from 'antd';

const { SubMenu } = Menu;
const { Sider } = Layout;

export interface ISideMenuProps {
  onOpen: (params: { key: string; title: string; linkTo: string }) => void;
  menus?: {
    key: string;
    title: string;
    subMenus: {
      key: string;
      title: string;
      linkTo: string;
    };
  }[];
}

interface IState {}

export class SideMenu extends React.Component<ISideMenuProps, IState> {
  /**
   * item's props contains all properties set in menu item
   * @param key
   * @param title
   * @param link
   */
  open = ({
    key,
    item: {
      props: { title, link },
    },
  }) => {
    const { onOpen } = this.props;
    onOpen({ key, title, linkTo: link });
  };

  buildSubMenu(menu) {
    return (
      <SubMenu key={menu.key} title={menu.title}>
        {_.map(menu.subMenus, subMenu => (
          <Menu.Item
            key={`${menu.key}::${subMenu.key}`}
            title={subMenu.title}
            link={subMenu.linkTo}
          >
            {subMenu.title}
          </Menu.Item>
        ))}
      </SubMenu>
    );
  }

  render() {
    const { menus } = this.props;

    if (!menus) {
      return (
        <Sider width={200} style={{ background: '#fff' }}>
          <div>loading menus...</div>
        </Sider>
      );
    }

    return (
      <Sider width={200} style={{ background: '#fff' }}>
        <Menu
          mode="inline"
          onClick={this.open}
          // defaultSelectedKeys={['1']}
          defaultOpenKeys={['models']}
          style={{ height: '100%', borderRight: 0 }}
        >
          {_.map(menus, this.buildSubMenu)}
        </Menu>
      </Sider>
    );
  }
}
