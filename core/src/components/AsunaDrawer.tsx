import React from 'react';
import { AsunaPlainInfo } from './AsunaPlainInfo';
import { DrawerButton } from './DrawerButton';

export const AsunaDrawerButton: React.FC<{
  text: string;
  record: object;
  modelName: string;
}> = ({ text, modelName, record }) => {
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
      {/*
      <WithFuture
        future={() => Promise.all([SchemaHelper.getSchema(modelName), SchemaHelper.getFormSchema(modelName)])}
      >
        {([schema, formSchema]) => (
          <List<{ key: string; title: string; value: any }>
            itemLayout="horizontal"
            dataSource={_.map(record, (value, key) => ({
              key,
              title: key,
              // fields[key]?.options?.name ?? fields[key]?.options?.label ?? fields[key]?.name,
              value,
            }))}
            renderItem={item => {
              const columnInfo = _.find(schema?.columns, column => column.name === item.key);
              const title = columnInfo?.config?.info?.name ?? item.title;

              return (
                <List.Item>
                  <List.Item.Meta
                    title={title}
                    description={
                      <WithDebugInfo info={{ item, record: record[item.key], columnInfo }}>
                        <div>{parseString(record[item.key] ?? '')}</div>
                      </WithDebugInfo>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </WithFuture>
*/}
    </DrawerButton>
  );
};
