import React  from 'react';
import styled from 'styled-components';

import { Layout, Menu } from 'antd';

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

export default () => (
  <AntdLayout>
    <Layout>
      <Header className="header">
        <div className="logo">
          <StyledLogoImg src="/static/logo.png" alt="mast" />
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={['2']}
          style={{ lineHeight: '64px' }}
        >
          <Menu.Item key="1">Home</Menu.Item>
        </Menu>
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
