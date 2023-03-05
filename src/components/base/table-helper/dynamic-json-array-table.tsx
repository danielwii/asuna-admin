/** @jsxRuntime classic */

/** @jsx jsx */
// noinspection ES6UnusedImports
import { css, jsx } from '@emotion/react';

import useLogger from '@danielwii/asuna-helper/dist/logger/hooks';
import { StaticImplements } from '@danielwii/asuna-helper/dist/types';
import { parseJSONIfCould } from '@danielwii/asuna-helper/dist/utils';

import { Button, Collapse, List } from 'antd';
import { useFormik } from 'formik';
import _ from 'lodash';
import React from 'react';

import { WithVariable } from '../helper/helper';

export type FieldOpts = (
  name: string,
  index: number,
) => { name: string; value: string; onChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> };

export interface ParsedFieldOpts {
  name: (name: string) => string;
  value: (name: string) => string;
}

export interface DynamicJsonTableAdapter {
  // 创建新元素
  createItem: () => any;
  // 生成用于输入标签的帮助方法
  fieldParser: (item, index: number) => ParsedFieldOpts;
  parseValue: (value) => any;
  unparseValue: (value) => any;
  clear: (onChange) => any;
  // 包括 onChange 的帮助方法
  getFieldOpts: (formik: ReturnType<typeof useFormik>, item) => FieldOpts;
}

export interface DynamicJsonTableProps<V extends Record<string, string | number>> {
  value: V;
  render: (opts: {
    formik: ReturnType<typeof useFormik>;
    item: object;
    index: number;
    fieldOpts: FieldOpts;
  }) => React.ReactNode;
  onChange: (values) => void;
  preview: (item, index: number) => React.ReactNode;
  adapter: DynamicJsonTableAdapter;
}

@StaticImplements<DynamicJsonTableAdapter>()
export class ObjectJsonTableHelper {
  public static key = 'key';
  public static createItem = () => ({ key: '' });
  public static keyParser = (value) => ({ [value.key]: _.omit(value, ObjectJsonTableHelper.key) });
  public static fieldParser = (value: any, index: number): ParsedFieldOpts => ({
    name: (name: string): string => `${index}.${name}`,
    value: (name: string): string => value?.[name],
  });
  public static parseValue = (value) =>
    _.chain(value)
      .toPairs()
      .groupBy(([k]) => k.split('-')[0])
      .flatMap((arr) => _.fromPairs(arr.map(([k, v]) => [k.split('-')[1], v])))
      .value();
  public static unparseValue = (value) =>
    _.assign({}, ..._.flatMap(value, (v, i) => _.mapKeys(v, (v, k) => `${i}-${k}`)));
  public static clear = (onChange) => onChange({});
  public static getFieldOpts =
    (formik: ReturnType<typeof useFormik>, item): FieldOpts =>
    (name: string, index: number) => {
      const field = ObjectJsonTableHelper.fieldParser(item, index);
      return { name: field.name(name), value: field.value(name), onChange: (event) => formik.handleChange(event) };
    };
}

@StaticImplements<DynamicJsonTableAdapter>()
export class StringArrayJsonTableHelper {
  public static createItem = () => '';
  public static keyParser = (value) => value;
  public static fieldParser = (value: any, index: number): ParsedFieldOpts => ({
    name: (name: string): string => `${index}.${name}`,
    value: (name: string): string => value,
  });
  public static parseValue = (value) => value;
  public static unparseValue = (value) => value;
  // public static unparseValue = value => _.flatten(_.map(value, field => (_.isObject(field) ? _.values(field) : field)));
  public static clear = (onChange) => onChange([]);
  public static getFieldOpts =
    (formik: ReturnType<typeof useFormik>, item): FieldOpts =>
    (name: string, index: number) => {
      const field = StringArrayJsonTableHelper.fieldParser(item, index);
      return {
        name: field.name(name),
        value: field.value(name),
        onChange: (event) => {
          // console.log(index, name, event.target.name, event.target.value);
          // formik.handleChange(event);
          formik.values[index] = event.target.value;
          formik.setValues(formik.values);
        },
      };
    };
}

@StaticImplements<DynamicJsonTableAdapter>()
export class ObjectArrayJsonTableHelper {
  public static createItem = () => ({});
  public static keyParser = (value) => value;
  public static fieldParser = (value: any, index: number): ParsedFieldOpts => ({
    name: (name: string): string => name, // `${index}.${name}`,
    value: (name: string): string => value[name],
  });
  public static parseValue = (value) => value;
  public static unparseValue = (value) => value;
  //  unparseValue = value => _.flatten(_.map(value, field => (_.isObject(field) ? _.values(field) : field)));
  public static clear = (onChange) => onChange([]);
  public static getFieldOpts =
    (formik: ReturnType<typeof useFormik>, item): FieldOpts =>
    (name: string, index: number) => {
      const field = ObjectArrayJsonTableHelper.fieldParser(item, index);
      return {
        name: field.name(name),
        value: field.value(name),
        onChange: (event) => {
          // console.log(index, this.fields, name, { name: event.target.name, value: event.target.value }, formik.values);
          // formik.handleChange(event);
          formik.values[index] = { ...formik.values[index], ...{ [name]: event.target.value } };
          formik.setValues(formik.values);
        },
      };
    };
}

export const DynamicJsonArrayTable: <T extends Record<string, string | number>>(
  props: DynamicJsonTableProps<T>,
) => React.ReactElement<DynamicJsonTableProps<T>> = ({ value, render, onChange, preview, adapter }) => {
  const initialValues = parseJSONIfCould(value as any) ?? {};

  const func = {
    parseValue: adapter.parseValue,
    unparseValue: adapter.unparseValue,
    remove: (index: number) => formik.setValues(_.filter(parsedFields, (o, i) => i !== index)),
    add: () => formik.setValues([...parsedFields, adapter.createItem()]),
    clear: () => adapter.clear(onChange),
    fieldOpts: adapter.getFieldOpts,
  };

  const parsedFields: object[] = func.parseValue(initialValues);
  const formik = useFormik({
    initialValues: parsedFields,
    validate: (values) => onChange(func.unparseValue(values)),
    onSubmit: (values) => {},
  });

  useLogger('DynamicJsonArrayTable', initialValues, parsedFields, formik.values);

  return (
    <React.Fragment>
      <List
        dataSource={parsedFields.map((v, i) => ({ [i]: v }))}
        renderItem={(indexObject, index) => (
          <WithVariable variable={indexObject[index]}>
            {(item) => (
              <List.Item
                actions={[
                  <Button key={index} size="small" danger onClick={() => func.remove(index)}>
                    remove
                  </Button>,
                ]}
                // extra={preview(item)}
              >
                {/* <List.Item.Meta /> */}
                <Collapse bordered={false}>
                  <Collapse.Panel
                    key={index}
                    header={
                      <div
                        css={css`
                          max-height: 10rem;
                          overflow-y: auto;
                        `}
                      >
                        {preview(item, index)}
                      </div>
                    }
                  >
                    {render({ formik: formik as any, item, index, fieldOpts: func.fieldOpts(formik as any, item) })}
                  </Collapse.Panel>
                </Collapse>
              </List.Item>
            )}
          </WithVariable>
        )}
        footer={
          <React.Fragment>
            <Button size="small" onClick={() => func.add()}>
              add
            </Button>{' '}
            <Button size="small" onClick={() => func.clear()}>
              clear
            </Button>
          </React.Fragment>
        }
      />
    </React.Fragment>
  );
};
