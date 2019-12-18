import { TenantInfo } from '@asuna-admin/adapters';
import { ISideMenuProps, SideMenu } from '@asuna-admin/components';
import { StoreContext } from '@asuna-admin/context/store';
import { AppContext } from '@asuna-admin/core';
import { panesActions, RootState } from '@asuna-admin/store';
import { Asuna } from '@asuna-admin/types';
import { Divider } from 'antd';
import * as React from 'react';
import { useContext, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CubeGrid } from 'styled-spinkit';
import * as util from 'util';
import * as _ from 'lodash';

export const SideMenuRender: React.FC = props => {
  // const [tenantInfo, setTenantInfo] = useState<TenantInfo>();
  const states = useSelector<RootState, Pick<ISideMenuProps, 'menus'>>(state => state.menu);
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

  const boundTenant = store.tenantInfo?.tenant;
  const hasTenantRoles = !_.isEmpty(store.tenantInfo?.hasTenantRoles);
  if (store.tenantInfo?.config?.enabled && !boundTenant && hasTenantRoles)
    return (
      <>
        <CubeGrid />{' '}
        {AppContext.isDebugMode && (
          <>
            <Divider />
            <pre>{util.inspect(store.tenantInfo, { depth: 10 })}</pre>
          </>
        )}
      </>
    );

  return <SideMenu {...props} {...states} {...actions} />;
};
