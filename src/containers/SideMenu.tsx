import { message } from 'antd';
import * as _ from 'lodash';
import * as React from 'react';
import { useContext } from 'react';
import { useAsyncRetry, useEffectOnce, useLogger } from 'react-use';
import { CubeGrid, FoldingCube } from 'styled-spinkit';

import { Func } from '../adapters/func';
import { SideMenu } from '../components/SideMenu';
import { StoreContext } from '../context/store';
import { DebugInfo } from '../helpers/debug';
import { TenantHelper } from '../helpers/tenant';
import { useSharedPanesFunc, useSharedPanesGlobalValue } from '../store/panes.global';

export const SideMenuRender: React.VFC = (props) => {
  // const [tenantInfo, setTenantInfo] = useState<TenantInfo>();
  const [, panesStateSetter] = useSharedPanesGlobalValue();
  const sharedPanesFunc = useSharedPanesFunc(panesStateSetter);

  const { store, updateStore } = useContext(StoreContext);
  const state = useAsyncRetry(async () =>
    Func.loadMenus().catch((reason) => {
      message.error(`init side menus error ${reason.message}`);
      return null;
    }),
  );
  useEffectOnce(() => {});
  /*
  useEffectOnce(() => {
    TenantHelper.reloadInfo().then(info => setTenantInfo(info));
    const subscription = TenantHelper.subject.subscribe((info: TenantInfo) => setTenantInfo(info));
    return () => subscription.unsubscribe();
  });
*/

  useLogger('SideMenuRender', state);

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
  return state.loading ? (
    <FoldingCube />
  ) : state.error ? (
    <div>
      Error: {state.error.message}
      <button onClick={state.retry}>重新拉取</button>
    </div>
  ) : state.value ? (
    <SideMenu {...props} menus={state.value?.menus} onOpen={sharedPanesFunc.open} />
  ) : (
    <div>
      <button onClick={state.retry}>重新拉取</button>
    </div>
  );
};
