import useLogger from '@danielwii/asuna-helper/dist/logger/hooks';

import * as React from 'react';
import { useEffect } from 'react';
import useLocalStorage from 'react-use/lib/useLocalStorage';

import { PanesView } from '../components/Panes';
import { AppContext } from '../core/context';
import { PanesState, useSharedPanesFunc, useSharedPanesGlobalValue } from '../store/panes.global';

const PanesViewContainer: React.FC = () => {
  const [_, setValue, remove] = useLocalStorage<PanesState>('menus');
  const [panesState, panesStateSetter] = useSharedPanesGlobalValue();
  const sharedPanesFunc = useSharedPanesFunc(panesStateSetter);
  AppContext.globalFunc.panes = sharedPanesFunc;

  useEffect(() => {
    setValue(panesState);
    return () => remove();
  }, [panesState]);

  useLogger('<[PanesViewContainer]>', panesState);

  return (
    <PanesView
      {...panesState}
      onActive={sharedPanesFunc.active}
      onClose={sharedPanesFunc.close}
      onCloseWithout={sharedPanesFunc.closeWithout}
      onCloseCurrent={sharedPanesFunc.closeCurrent}
    />
  );
};
export default PanesViewContainer;
