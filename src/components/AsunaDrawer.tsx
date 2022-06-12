import React from 'react';

import { AsunaPlainInfo } from './AsunaPlainInfo';
import { DrawerButton } from './base/drawer-button/drawer-button';

export const AsunaDrawerButton: React.VFC<{
  text: React.ReactNode;
  record: object;
  modelName: string;
  extra?: React.ReactNode;
}> = ({ text, modelName, record, extra }) => {
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
