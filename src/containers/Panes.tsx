import * as React from 'react';

import { PanesView } from '../components';
import { AppContext } from '../core';
import { useSharedPanesFunc, useSharedPanesGlobalValue } from '../store/panes.global';

const PanesViewContainer: React.FC = (props) => {
  const [panesState, panesStateSetter] = useSharedPanesGlobalValue();
  const sharedPanesFunc = useSharedPanesFunc(panesStateSetter);
  AppContext.globalFunc.panes = sharedPanesFunc;

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
