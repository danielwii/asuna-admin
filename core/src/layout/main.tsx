import { ProgressBar } from '@asuna-admin/components';
import { HeaderContainer, PanesContainer, SideMenuContainer } from '@asuna-admin/containers';
import { createLogger } from '@asuna-admin/logger';

import { Layout } from 'antd';
import React from 'react';
import styled from 'styled-components';

import WithStyles from './with-styles';

const logger = createLogger('layout:main');

const StyledContentDiv = styled.div`
  background: #fff;
  padding: 0.5rem;
  margin: 0;
  min-height: 280px;
`;

export default ({ loading, heartbeat, auth, appInfo, hideCharacteristics }) => {
  logger.log('status', { loading, heartbeat, auth, appInfo });
  return (
    <WithStyles hideCharacteristics={hideCharacteristics}>
      <Layout>
        {/*{loading && <LivingLoading heartbeat={heartbeat} />}*/}
        <ProgressBar />
        <HeaderContainer {...{ hideLogo: hideCharacteristics }} />
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
