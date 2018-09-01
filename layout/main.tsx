import React from 'react';
import styled from 'styled-components';

import { Layout } from 'antd';

import AntdLayout from './antd';

import HeaderContainer from '@asuna-admin/containers/Header';
import PanesContainer from '@asuna-admin/containers/Panes';
import SideMenuContainer from '@asuna-admin/containers/SideMenu';

import Loading from '@asuna-admin/components/LivingLoading';
import ProgressBar from '@asuna-admin/components/ProgressBar';

const StyledContentDiv = styled.div`
  background: #fff;
  padding: 0.5rem;
  margin: 0;
  min-height: 280px;
`;

export default ({ loading, heartbeat, auth, appInfo }) => (
  <AntdLayout>
    <Layout>
      {loading && <Loading heartbeat={heartbeat} />}
      <ProgressBar />
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
