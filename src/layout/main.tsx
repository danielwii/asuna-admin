import useLogger from '@danielwii/asuna-helper/dist/logger/hooks';

import { Layout } from 'antd';
import * as React from 'react';
import styled from 'styled-components';

import { HeaderContainer } from '../containers/Header';
import PanesViewContainer from '../containers/Panes';
import { SideMenuContainer } from '../containers/SideMenu';
import { StoreContextProvider } from '../context/store';
import { createLogger } from '../logger';
import WithStyles from './with-styles';

const logger = createLogger('layout:main');

const StyledContentDiv = styled.div`
  background: #fff;
  padding: 0.5rem;
  margin: 0;
  min-height: 280px;
`;

const Main: React.FC<{ hideCharacteristics?: boolean }> = ({ hideCharacteristics }) => {
  useLogger('<[Main]>', { hideCharacteristics });

  return (
    <StoreContextProvider>
      <WithStyles hideCharacteristics={hideCharacteristics}>
        <Layout>
          {/*{loading && <LivingLoading heartbeat={heartbeat} />}*/}
          {/*<ProgressBar />*/}
          <HeaderContainer hideLogo={hideCharacteristics} />
          <Layout>
            <Layout.Sider theme="light" /*style={{ overflow: 'auto', height: '90vh', position: 'fixed', left: 0 }}*/>
              <SideMenuContainer />
            </Layout.Sider>
            <Layout style={{ /*marginLeft: 200,*/ padding: '.5rem' }}>
              <StyledContentDiv>
                <PanesViewContainer />
              </StyledContentDiv>
            </Layout>
          </Layout>
        </Layout>
      </WithStyles>
    </StoreContextProvider>
  );
};

export default Main;
