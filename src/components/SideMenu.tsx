import { Layout, Menu, MenuProps } from 'antd';
import _ from 'lodash';
import * as fp from 'lodash/fp';
import * as React from 'react';

import { AppContext } from '../core/context';
import { createLogger } from '../logger';
import { Asuna } from '../types';

const logger = createLogger('components:side-menu');

// no link exists in item anymore
const MenuItem: any | { link: string } = Menu.Item;
type ExtraMenuItem = Required<MenuProps>['items'][number] & {
  link?: string;
  title?: string;
  model?: string;
  component?: string;
};

export interface ISideMenuProps {
  onOpen: (pane: Asuna.Schema.Pane) => void;
  menus?: Asuna.Schema.Menu[];
}

export const SideMenu: React.FC<ISideMenuProps> = ({ menus, onOpen }) => {
  const methods = {
    open: ({ key, keyPath, domEvent, item }) => {
      const {
        props: { model, title, link },
      } = item;
      const { component } =
        _.flow(
          fp.map(fp.get('subMenus')),
          _.flatten,
          fp.find((subMenu: Asuna.Schema.SubMenu) => subMenu.key === _.get(key.split('::'), 1)),
        )(AppContext.ctx.menu.getSideMenus()) ?? ({} as any);
      logger.log('open', { key, model, title, link, component });
      onOpen({ key, model, title, linkTo: link, component });
    },

    buildSubMenus: (menus: Asuna.Schema.Menu[]): Required<MenuProps>['items'] =>
      menus.map((menu: Asuna.Schema.Menu) => {
        const groups = _.groupBy(menu.subMenus, (subMenu: Asuna.Schema.ComponentSubMenu) => subMenu.group || 'default');
        const subMenus = _.flatMap(
          groups,
          (groupMenus: Asuna.Schema.ComponentSubMenu, groupName: string): ExtraMenuItem[] => {
            const subMenus = _.map<any, ExtraMenuItem>(groupMenus, (groupMenu: Asuna.Schema.ComponentSubMenu) => {
              return {
                key: `${menu.key}::${groupMenu.key}`,
                label: groupMenu.title,
                model: groupMenu.model,
                title: groupMenu.title,
                link: groupMenu.linkTo,
                component: groupMenu.component,
              };
            });
            if (groupName === 'default') {
              if (
                _.keys(_.groupBy(menu.subMenus, (subMenu: Asuna.Schema.ComponentSubMenu) => subMenu.group)).length === 1
              ) {
                return subMenus;
              }
              return [
                {
                  key: menu.key,
                  label: '---',
                  children: subMenus,
                },
              ];
            }
            return [
              {
                key: `${menu.key}::${groupName}`,
                label: '2.' + groupName,
                children: subMenus,
              },
            ];
          },
        );
        return { key: menu.key, label: menu.title, children: subMenus };
      }),
    /**
     * @deprecated remove next version
     * @param menu
     */
    buildSubMenu: (menu: Asuna.Schema.Menu) => (
      <Menu.SubMenu key={menu.key} title={menu.title}>
        {_.map(
          _.groupBy(menu.subMenus, (subMenu: Asuna.Schema.ComponentSubMenu) => subMenu.group || 'default'),
          (groupMenus: Asuna.Schema.ComponentSubMenu, groupName: string) => {
            const subMenusComponent = _.map(
              groupMenus,
              (groupMenu: Asuna.Schema.ComponentSubMenu /* 统一按照通用组件处理 */) => (
                <MenuItem
                  key={`${menu.key}::${groupMenu.key}`}
                  model={groupMenu.model}
                  title={groupMenu.title}
                  link={groupMenu.linkTo}
                  component={groupMenu.component}
                >
                  {groupMenu.title}
                </MenuItem>
              ),
            );

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
      </Menu.SubMenu>
    ),
  };

  if (!menus) {
    return (
      <Layout.Sider width={200} style={{ background: '#fff' }}>
        <div>loading menus...</div>
      </Layout.Sider>
    );
  }

  return (
    <Layout.Sider width={200} style={{ background: '#fff' }}>
      <Menu
        mode="inline"
        onClick={methods.open}
        // defaultSelectedKeys={['1']}
        defaultOpenKeys={['models']}
        style={{ height: '100%', borderRight: 0 }}
        items={methods.buildSubMenus(menus)}
      />
    </Layout.Sider>
  );
};
