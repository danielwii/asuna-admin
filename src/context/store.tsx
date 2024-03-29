import * as React from 'react';
import { useState } from 'react';
import useEffectOnce from 'react-use/lib/useEffectOnce';

import { AppContext } from '../core/context';
import { createLogger } from '../logger';

import type { TenantInfo } from '../adapters/admin.plain';

export type StoreContextKey = 'tenantInfo';

const logger = createLogger('store');

export const StoreContext = React.createContext<{
  store: Partial<{ tenantInfo: TenantInfo }>;
  updateStore: (key: StoreContextKey, value: any) => void;
}>(null as any);

export const StoreContextProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [store, setStore] = useState({});

  const updateStore = (key: StoreContextKey, value: any) => setStore({ ...store, [key]: value });

  useEffectOnce(() => {
    logger.info('AppContext is', AppContext.ctx);
  });
  /*
  useEffectOnce(() => {
    TenantHelper.reloadInfo().then((info) => updateStore('tenantInfo', info));
    const subscription = TenantHelper.subject.subscribe((info: TenantInfo) => updateStore('tenantInfo', info));
    return () => subscription.unsubscribe();
  });*/

  return <StoreContext.Provider value={{ store, updateStore }}>{children}</StoreContext.Provider>;
};
