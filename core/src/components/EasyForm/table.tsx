import { parseJSONIfCould } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';
import { Button, List } from 'antd';
import { useFormik } from 'formik';
import _ from 'lodash';
import React from 'react';
import { useLogger } from 'react-use';

const logger = createLogger('components:easy-form:table');

interface DynamicJsonTableProps<V = {}> {
  mode?: 'group' | 'array'; // TODO 分离两种模式
  value: V;
  render: (formik, item, index: number) => React.ReactNode;
  onChange: (values) => void;
  // createItem: (index: number) => object;
  preview: (item) => React.ReactNode;
}

export const DynamicJsonArrayTable: <T = {}>(
  props: DynamicJsonTableProps<T>,
) => React.ReactElement<DynamicJsonTableProps<T>> = ({
  mode,
  value,
  render,
  onChange,
  // createItem,
  preview,
}) => {
  const initialValues = parseJSONIfCould(value as any) ?? (mode === 'array' ? [] : {});
  const parsedFields =
    mode === 'array'
      ? initialValues
      : _.chain(initialValues)
          .toPairs()
          .groupBy(([key]) => key.split('-')[0])
          .flatMap(_.fromPairs)
          .value();
  const formik = useFormik({
    initialValues: parsedFields,
    validate: values => {
      const updated = _.chain(_.omitBy(values, (v, k) => _.isObject(v)))
        .toPairs()
        .groupBy(([key]) => key.split('-')[0])
        .flatMap(_.fromPairs)
        .value();
      const changed = _.assign({}, ...parsedFields, ...updated);
      logger.log('DynamicJsonArrayTable.validate', values, updated, parsedFields, changed);
      onChange(changed);
    },
    onSubmit: values => {},
  });

  /*
  function createItem(index: number): any {
    return mode === 'array' ? [...(parsedFields || []), {}] : { [`${index}-key`]: '' };
  }
*/
  function remove(index: number): void {
    mode === 'array'
      ? onChange(_.remove(parsedFields, (o, i) => i !== index))
      : onChange(_.omitBy(parsedFields, (field, key) => +key.split('-')[0] === index));
  }
  function add() {
    mode === 'array'
      ? onChange([...parsedFields, {}])
      : onChange({ ...parsedFields, ...{ [`${parsedFields.length}-key`]: '' } });
  }

  useLogger(DynamicJsonArrayTable.name, { value, initialValues, formik, parsedFields });

  return (
    <>
      <List
        dataSource={parsedFields}
        renderItem={(item, index) => (
          <List.Item
            actions={[
              <Button size="small" type="danger" onClick={() => remove(index)}>
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
          <Button size="small" onClick={() => add()}>
            add
          </Button>
        }
      />
    </>
  );
};
