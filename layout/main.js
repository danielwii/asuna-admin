import React  from 'react';
import styled from 'styled-components';

import { Layout } from 'antd';

import AntdLayout        from './antd';
import HeaderContainer   from '../containers/Header';
import PanesContainer    from '../containers/Panes';
import SideMenuContainer from '../containers/SideMenu';

const StyledContentDiv = styled.div`
  background: #fff;
  padding: .5rem;
  margin: 0;
  min-height: 280px;
`;

export default () => (
  <AntdLayout>
    <Layout>
      <HeaderContainer />
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
