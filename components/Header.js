import React     from 'react';
import PropTypes from 'prop-types';
import styled    from 'styled-components';

import { Button, Dropdown, Icon, Layout, Menu } from 'antd';

// eslint-disable-next-line import/extensions
import { authActions } from '../store/auth.actions';
// eslint-disable-next-line import/extensions
import pkg             from '../package.json';

const { Header } = Layout;

const StyledLogoImg = styled.img`
  width: 120px;
  height: 32px;
  margin: 16px 28px 16px 0;
  float: left;
  border-radius: 0.1rem;
`;
const StyledVersion = styled.span`
  color: silver;
  vertical-align: baseline;
`;

export default class extends React.Component {
  static propTypes = {
    auth  : PropTypes.shape({}),
    app   : PropTypes.shape({}),
    onSync: PropTypes.func,
    env   : PropTypes.string,
  };

  logout = () => {
    const { dispatch } = this.props;
    dispatch(authActions.logout());
  };

  menu = () => (
    <Menu>
      <Menu.Item>
        <a target="_blank" rel="noopener noreferrer" href="#">Profile</a>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item>
        <a target="_blank" rel="noopener noreferrer" onClick={this.logout}>Logout</a>
      </Menu.Item>
    </Menu>
  );

  render() {
    const { auth, app, onSync, env } = this.props;
    return (
      <Header className="header">
        <div className="logo">
          <StyledLogoImg src="/static/logo.png" alt="mast" />
        </div>
        <StyledVersion>{env}-v{pkg.version}::{app.version}</StyledVersion>
        {/*
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={['2']}
          style={{ lineHeight: '64px' }}
        >
          <Menu.Item key="1">Home</Menu.Item>
        </Menu>
        */}
        <div className="header-user">
          {auth.username ? (
            <div>
              Welcome,&nbsp;
              <Dropdown overlay={this.menu()}>
                <a>{auth.username}</a>
              </Dropdown>
              .
              {' '}
              <Button icon="sync" onClick={onSync} />
            </div>
          ) : <Icon type="loading" style={{ marginLeft: 8, fontSize: 24 }} spin />}
        </div>
        {/* language=CSS */}
        <style jsx>{`
          .header-user {
            float: right;
            color: white;
          }
        `}</style>
      </Header>
    );
  }
}
