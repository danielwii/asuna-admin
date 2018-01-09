import React     from 'react';
import PropTypes from 'prop-types';
import _         from 'lodash';

import { Layout, Menu } from 'antd';

const { SubMenu } = Menu;
const { Sider }   = Layout;

export default class extends React.Component {
  static propTypes = {
    onOpen: PropTypes.func.isRequired,
    menus : PropTypes.arrayOf(PropTypes.shape({
      key     : PropTypes.string.isRequired,
      title   : PropTypes.string.isRequired,
      subMenus: PropTypes.arrayOf(PropTypes.shape({
        key   : PropTypes.string.isRequired,
        title : PropTypes.string.isRequired,
        linkTo: PropTypes.string.isRequired,
      })),
    })),
  };

  constructor(props) {
    super(props);

    this.open = this.open.bind(this);
  }

  /**
   * item's props contains all properties set in menu item
   * @param key
   * @param title
   * @param linkTo
   */
  open({ key, item: { props: { title, linkTo } } }) {
    const { onOpen } = this.props;
    onOpen({ key, title, linkTo });
  }

  buildSubMenu(menu) {
    return (
      <SubMenu key={menu.key} title={menu.title}>
        {_.map(menu.subMenus, subMenu => (
          <Menu.Item
            key={`${menu.key}::${subMenu.key}`}
            title={subMenu.title}
            linkTo={subMenu.linkTo}
          >{subMenu.title}
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
