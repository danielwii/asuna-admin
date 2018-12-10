import React from 'react';
import styled from 'styled-components';

import { Layout } from 'antd';

import WithStyles from './with-styles';

import { HeaderContainer, PanesContainer, SideMenuContainer } from '@asuna-admin/containers';
import { LivingLoading, ProgressBar } from '@asuna-admin/components';
import { createLogger } from '@asuna-admin/logger';

const logger = createLogger('layout:main', 'info');

const StyledContentDiv = styled.div`
  background: #fff;
  padding: 0.5rem;
  margin: 0;
  min-height: 280px;
`;

export default ({ loading, heartbeat, auth, appInfo }) => {
  logger.log('status', { loading, heartbeat, auth, appInfo });
  return (
    <WithStyles>
      <Layout>
        {(loading || !heartbeat) && <LivingLoading heartbeat={heartbeat} />}
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
    </WithStyles>
  );
};
