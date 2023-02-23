import useLogger from '@danielwii/asuna-helper/dist/logger/hooks';

import { Button, message } from 'antd';
import * as _ from 'lodash';
import * as React from 'react';
import { useContext } from 'react';
import useAsyncRetry from 'react-use/lib/useAsyncRetry';
import { CubeGrid, FoldingCube } from 'styled-spinkit';

import { Func } from '../adapters/func';
import { SideMenu } from '../components/SideMenu';
import { StoreContext } from '../context/store';
import { DebugInfo } from '../helpers/debug';
import { TenantHelper } from '../helpers/tenant';
import { useSharedPanesFunc, useSharedPanesGlobalValue } from '../store/panes.global';

export const SideMenuContainer: React.FC = (props) => {
  // const [tenantInfo, setTenantInfo] = useState<TenantInfo>();
  const [, panesStateSetter] = useSharedPanesGlobalValue();
  const sharedPanesFunc = useSharedPanesFunc(panesStateSetter);

  const { store, updateStore } = useContext(StoreContext);
  const menuLoader = useAsyncRetry(async () =>
    Func.loadMenus().catch((reason) => {
      message.error(`init side menus error ${reason.message}`);
      return null;
    }),
  );
  /*
  useEffectOnce(() => {
    TenantHelper.reloadInfo().then(info => setTenantInfo(info));
    const subscription = TenantHelper.subject.subscribe((info: TenantInfo) => setTenantInfo(info));
    return () => subscription.unsubscribe();
  });
*/

  useLogger('<[SideMenuContainer]>', menuLoader.loading, menuLoader, store);

  // --------------------------------------------------------------
  // tenant support
  // --------------------------------------------------------------

  const isTenantEnabled = store.tenantInfo?.config?.enabled;
  const hasTenantRoles = !_.isEmpty(store.tenantInfo?.roles);
  const authorized = TenantHelper.authorized(store.tenantInfo);

  if (isTenantEnabled && hasTenantRoles && !authorized)
    return (
      <>
        <CubeGrid />
        <DebugInfo data={{ store, isTenantEnabled, hasTenantRoles, authorized }} />
      </>
    );

  return menuLoader.loading ? (
    <FoldingCube />
  ) : menuLoader.error ? (
    <div>
      Error: {menuLoader.error.message}
      <button onClick={menuLoader.retry}>重新拉取</button>
    </div>
  ) : menuLoader.value ? (
    <SideMenu {...props} menus={menuLoader.value?.menus} onOpen={sharedPanesFunc.open} />
  ) : (
    <div style={{ textAlign: 'center', margin: '1rem' }}>
      <Button onClick={menuLoader.retry}>重新拉取</Button>
    </div>
  );
};
