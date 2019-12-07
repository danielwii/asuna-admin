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
  menus?: Asuna.Schema.Menu[];
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

  buildSubMenu = (menu: Asuna.Schema.Menu) => (
    <SubMenu key={menu.key} title={menu.title}>
      {_.map(
        _.groupBy(menu.subMenus, (subMenu: Asuna.Schema.ComponentSubMenu) => subMenu.group || 'default'),
        (groupMenus: Asuna.Schema.ComponentSubMenu, groupName: string) => {
          const subMenusComponent = _.map(groupMenus, (
            groupMenu: Asuna.Schema.ComponentSubMenu /* 统一按照通用组件处理 */,
          ) => (
            <MenuItem
              key={`${menu.key}::${groupMenu.key}`}
              model={groupMenu.model}
              title={groupMenu.title}
              link={groupMenu.linkTo}
              component={groupMenu.component}
            >
              {groupMenu.title}
            </MenuItem>
          ));

          if (groupName === 'default') {
            if (_.keys(_.groupBy(menu.subMenus, 'group')).length > 1) {
              return (
                <Menu.ItemGroup key={`${menu.key}::${groupName}`} title={'---'}>
                  {subMenusComponent}
                </Menu.ItemGroup>
              );
            }
            return subMenusComponent;
          }
          return (
            <Menu.ItemGroup key={`${menu.key}::${groupName}`} title={groupName}>
              {subMenusComponent}
            </Menu.ItemGroup>
          );
        },
      )}
    </SubMenu>
  );

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
