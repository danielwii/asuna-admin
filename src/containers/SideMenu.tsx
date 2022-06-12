import * as _ from 'lodash';
import * as React from 'react';
import { useContext } from 'react';
import { useSelector } from 'react-redux';
import { CubeGrid } from 'styled-spinkit';

import { ISideMenuProps, SideMenu } from '../components/SideMenu';
import { StoreContext } from '../context/store';
import { DebugInfo } from '../helpers/debug';
import { TenantHelper } from '../helpers/tenant';
import { useSharedPanesFunc, useSharedPanesGlobalValue } from '../store/panes.global';

import type { RootState } from '../store/types';

export const SideMenuRender: React.FC = (props) => {
  // const [tenantInfo, setTenantInfo] = useState<TenantInfo>();
  const [, panesStateSetter] = useSharedPanesGlobalValue();
  const sharedPanesFunc = useSharedPanesFunc(panesStateSetter);

  const states = useSelector<RootState, Pick<ISideMenuProps, 'menus'>>((state) => state.menu);
  const { store, updateStore } = useContext(StoreContext);
  /*
  useEffectOnce(() => {
    TenantHelper.reloadInfo().then(info => setTenantInfo(info));
    const subscription = TenantHelper.subject.subscribe((info: TenantInfo) => setTenantInfo(info));
    return () => subscription.unsubscribe();
  });
*/

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

  return <SideMenu {...props} {...states} onOpen={sharedPanesFunc.open} />;
};
