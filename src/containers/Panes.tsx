import useLogger from '@danielwii/asuna-helper/dist/logger/hooks';

import * as React from 'react';

import { PanesView } from '../components/Panes';
import { AppContext } from '../core/context';
import { useSharedPanesFunc, useSharedPanesGlobalValue } from '../store/panes.global';

const PanesViewContainer: React.FC = () => {
  const [panesState, panesStateSetter] = useSharedPanesGlobalValue();
  const sharedPanesFunc = useSharedPanesFunc(panesStateSetter);
  AppContext.globalFunc.panes = sharedPanesFunc;

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
