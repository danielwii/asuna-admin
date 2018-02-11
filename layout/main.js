import React  from 'react';
import styled from 'styled-components';

import { Layout, Menu, Dropdown, Spin } from 'antd';

import AntdLayout        from './antd';
import PanesContainer    from '../containers/Panes';
import SideMenuContainer from '../containers/SideMenu';

const StyledLogoImg = styled.img`
  width: 120px;
  height: 32px;
  margin: 16px 28px 16px 0;
  float: left;
`;

const StyledContentDiv = styled.div`
  background: #fff;
  padding: .5rem;
  margin: 0;
  min-height: 280px;
`;

const { Header } = Layout;

const menu = (
  <Menu>
    <Menu.Item>
      <a target="_blank" rel="noopener noreferrer" href="#">Profile</a>
    </Menu.Item>
    <Menu.Divider />
    <Menu.Item>
      <a target="_blank" rel="noopener noreferrer" href="#">Logout</a>
    </Menu.Item>
  </Menu>
);

export default ({ auth }) => (
  <AntdLayout>
    <Layout>
      <Header className="header">
        <div className="logo">
          <StyledLogoImg src="/static/logo.png" alt="mast" />
        </div>
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
              <Dropdown overlay={menu}>
                <a>{auth.username}</a>
              </Dropdown>
              .
            </div>
          ) : <Spin size="small" style={{ marginLeft: 8 }} />}
        </div>
        {/* language=CSS */}
        <style jsx>{`
          .header-user {
            float: right;
            color: white;
          }
        `}</style>
      </Header>
      <Layout>
        <SideMenuContainer />
        <Layout style={{ padding: '1rem' }}>
          <StyledContentDiv>
            <PanesContainer />
          </StyledContentDiv>
        </Layout>
      </Layout>
    </Layout>
  </AntdLayout>
);
