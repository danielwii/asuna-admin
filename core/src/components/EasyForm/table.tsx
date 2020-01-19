import { parseJSONIfCould } from '@asuna-admin/helpers';
import { Button, List } from 'antd';
import { useFormik } from 'formik';
import _ from 'lodash';
import React from 'react';
import { useLogger } from 'react-use';

interface DynamicJsonTableProps<V = {}> {
  value: V;
  render: (formik, item, index: number) => React.ReactNode;
  onChange: (values) => void;
  createItem: (index: number) => object;
  preview: (item) => React.ReactNode;
}

export const DynamicJsonArrayTable: React.FC<DynamicJsonTableProps> = <T extends {}>({
  value,
  render,
  onChange,
  createItem,
  preview,
}) => {
  const initialValues = parseJSONIfCould(value as any) || {};
  const parsedFields = _.chain(initialValues)
    .toPairs()
    .groupBy(([key]) => key.split('-')[0])
    .flatMap(_.fromPairs)
    // .map(value => _.assign({}, ..._.values(value)))
    .value();
  const formik = useFormik({ initialValues, validate: values => onChange(values), onSubmit: values => {} });

  useLogger(DynamicJsonArrayTable.name, { value, initialValues, formik, parsedFields });

  return (
    <>
      <List
        dataSource={parsedFields}
        renderItem={(item, index) => (
          <List.Item
            actions={[
              <Button
                size="small"
                type="danger"
                onClick={() => onChange(_.omitBy(value, (field, key) => +key.split('-')[0] === index))}
              >
                remove
              </Button>,
            ]}
            // extra={preview(item)}
          >
            {/*<List.Item.Meta />*/}
            <div>
              <div>{render(formik, item, index)}</div>
              <div>data: {preview(item)}</div>
            </div>
          </List.Item>
        )}
        footer={
          <Button size="small" onClick={() => onChange({ ...value, ...createItem(parsedFields.length) })}>
            add
          </Button>
        }
      />
    </>
  );
};
