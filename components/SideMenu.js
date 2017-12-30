import React     from 'react';
import PropTypes from 'prop-types';
import _         from 'lodash';
import * as R    from 'ramda';

import { Layout, Menu } from 'antd';

const { SubMenu } = Menu;
const { Sider }   = Layout;

export default class extends React.Component {
  static propTypes = {
    goto : PropTypes.func.isRequired,
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

    this.goto = this.goto.bind(this);
  }

  goto({ key }) {
    const { goto } = this.props;
    const linkTo   = R.compose(R.last, R.split('::'))(key);
    goto(linkTo);
  }

  buildSubMenu(subMenu) {
    return (
      <SubMenu key={subMenu.key} title={subMenu.title}>
        {_.map(subMenu.subMenus, menu => (
          <Menu.Item key={`${menu.key}::${menu.linkTo}`}>{menu.title}</Menu.Item>
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
          onClick={this.goto}
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
