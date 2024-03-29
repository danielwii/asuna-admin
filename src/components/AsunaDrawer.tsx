import useLogger from '@danielwii/asuna-helper/dist/logger/hooks';

import React from 'react';

import { AsunaPlainInfo } from './AsunaPlainInfo';
import { DrawerButton } from './base/drawer-button/drawer-button';

export const AsunaDrawerButton: React.FC<{
  text: React.ReactNode;
  record: object;
  modelName: string;
  extra?: React.ReactNode;
}> = ({ text, modelName, record, extra }) => {
  // useLogger('<[AsunaDrawerButton]>', { text, modelName, extra }, record);

  return (
    <DrawerButton
      text={text}
      // key={draft.refId}
      // text={`${moment(draft.updatedAt).calendar()}(${moment(draft.updatedAt).fromNow()})`}
      // title={`Draft: ${draft.type} / ${draft.refId}`}
      size="small"
      type="dashed"
      width="40%"
    >
      <AsunaPlainInfo modelName={modelName} record={record} />
      {extra}
    </DrawerButton>
  );
};
