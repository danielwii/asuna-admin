import { createLogger } from '@asuna-admin/logger';
import { Asuna } from '@asuna-admin/types';

import { Layout, Menu } from 'antd';
import _ from 'lodash';
import React from 'react';

const logger = createLogger('components:side-menu');

const { SubMenu } = Menu;
// no link exists in item any more
const MenuItem: any | { link: string } = Menu.Item;
const { Sider } = Layout;

export interface ISideMenuProps {
  onOpen: (pane: Asuna.Schema.Pane) => void;
  menus?: {
    key: string;
    title: string;
    subMenus: {
      key: string;
      model?: string;
      title: string;
      linkTo: string;
    };
  }[];
}

interface IState {}

export class SideMenu extends React.Component<ISideMenuProps, IState> {
  /**
   * item's props contains all properties set in menu item
   */
  open = ({
    key,
    item: {
      props: { model, title, link, component },
    },
  }) => {
    logger.log('open', { key, model, title, link, component });
    const { onOpen } = this.props;
    onOpen({ key, model, title, linkTo: link, component });
  };

  buildSubMenu(menu: Asuna.Schema.Menu) {
    return (
      <SubMenu key={menu.key} title={menu.title}>
        {_.map(menu.subMenus, subMenu => (
          <MenuItem
            key={`${menu.key}::${subMenu.key}`}
            model={subMenu.model}
            title={subMenu.title}
            link={subMenu.linkTo}
            component={subMenu.component}
          >
            {subMenu.title}
          </MenuItem>
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
