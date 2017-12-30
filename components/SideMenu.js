import React     from 'react';
import PropTypes from 'prop-types';
import _         from 'lodash';

import { Layout, Menu } from 'antd';

const { SubMenu } = Menu;
const { Sider }   = Layout;

export default class extends React.Component {
  static propTypes = {
    add  : PropTypes.func.isRequired,
    menus: PropTypes.arrayOf(PropTypes.shape({
      key     : PropTypes.string.isRequired,
      title   : PropTypes.string.isRequired,
      subMenus: PropTypes.arrayOf(PropTypes.shape({
        key   : PropTypes.string.isRequired,
        title : PropTypes.string.isRequired,
        linkTo: PropTypes.string.isRequired,
      })).isRequired,
    })).isRequired,
  };

  constructor(props) {
    super(props);

    this.open = this.open.bind(this);
  }

  open({ key, item: { props: { title } } }) {
    const { add } = this.props;
    add({ key, title });
  }

  buildSubMenu(subMenu) {
    return (
      <SubMenu key={subMenu.key} title={subMenu.title}>
        {_.map(subMenu.subMenus, menu => (
          <Menu.Item key={menu.key} title={menu.title}>{menu.title}</Menu.Item>
        ))}
      </SubMenu>
    );
  }

  render() {
    const { menus } = this.props;

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
