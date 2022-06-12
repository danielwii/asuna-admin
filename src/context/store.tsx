import * as React from 'react';
import { useState } from 'react';
import { useEffectOnce } from 'react-use';

import { TenantInfo } from '../adapters/admin.plain';
import { TenantHelper } from '../helpers/tenant';

export type StoreContextKey = 'tenantInfo';

export const StoreContext = React.createContext<{
  store: Partial<{ tenantInfo: TenantInfo }>;
  updateStore: (key: StoreContextKey, value: any) => void;
}>(null as any);

export const StoreContextProvider: React.FC = ({ children }) => {
  const [store, setStore] = useState({});

  const updateStore = (key: StoreContextKey, value: any) => setStore({ ...store, [key]: value });

  useEffectOnce(() => {
    TenantHelper.reloadInfo().then((info) => updateStore('tenantInfo', info));
    const subscription = TenantHelper.subject.subscribe((info: TenantInfo) => updateStore('tenantInfo', info));
    return () => subscription.unsubscribe();
  });

  return <StoreContext.Provider value={{ store, updateStore }}>{children}</StoreContext.Provider>;
};
