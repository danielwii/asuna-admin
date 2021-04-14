import * as _ from 'lodash';
import * as React from 'react';
import { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CubeGrid } from 'styled-spinkit';

import { ISideMenuProps, SideMenu } from '../components';
import { StoreContext } from '../context/store';
import { DebugInfo, TenantHelper } from '../helpers';
import { panesActions, RootState } from '../store';
import { Asuna } from '../types';

export const SideMenuRender: React.FC = (props) => {
  // const [tenantInfo, setTenantInfo] = useState<TenantInfo>();
  const states = useSelector<RootState, Pick<ISideMenuProps, 'menus'>>((state) => state.menu);
  const dispatch = useDispatch();
  const actions: {
    [action in keyof Pick<ISideMenuProps, 'onOpen'>]: any;
  } = { onOpen: (pane: Asuna.Schema.Pane) => dispatch(panesActions.open(pane)) };
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

  return <SideMenu {...props} {...states} {...actions} />;
};
