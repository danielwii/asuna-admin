import React from 'react';
import * as R from 'ramda';
import * as _ from 'lodash';
import { Select } from 'antd';
import { WrappedFormUtils } from 'antd/es/form/Form';
import { arrayMove, SortableContainer, SortableElement } from 'react-sortable-hoc';

import { generateComponent, IFormItemLayout } from '.';

import { createLogger } from '@asuna-admin/logger';

const logger = createLogger('components:dynamic-form:elements', 'warn');

interface IMixedSelectProps {
  value?: any[];
}

interface IMixedSelectState<T> {
  selectedItems: T[];
  filterItems: T[];
  existItems: T[];
}

export type SelectOptions = {
  key: string;
  name: string;
  label: string;
  placeholder: string;
  items: (object & { id: string | number })[];
  existItems?: (object & { id: string | number })[];
  mode: 'default' | 'multiple' | 'tags' | 'combobox';
  getName: () => string;
  getValue: () => string;
  withSortTree: boolean;
  onChange?: (selectedItems: number | string | any[]) => void;
  onSearch?: (value: string, cb: (response: object) => void) => any;
  enumSelector: { name?: string; value?: string };
};

const defaultFormItemLayout = {};

export function generateSelect<T>(
  form: WrappedFormUtils,
  {
    key,
    name,
    label,
    placeholder,
    items,
    existItems,
    mode,
    getName = R.prop('name'),
    getValue = R.prop('value'),
    withSortTree = false,
    onChange,
    onSearch,
    enumSelector = {},
  }: SelectOptions,
  formItemLayout: IFormItemLayout = defaultFormItemLayout,
) {
  const fieldName = key || name;
  const labelName = label || name || key;
  logger.debug('[generateSelect]', { items, enumSelector });

  class MixedSelect extends React.Component<
    IMixedSelectProps,
    IMixedSelectState<object & { id: string | number }>
  > {
    constructor(props) {
      super(props);

      logger.debug('[MixedSelect]', '[constructor]', this.props);
      this.state = {
        selectedItems: this.props.value || [],
        filterItems: items || [],
        existItems: existItems || [],
      };
    }

    _getAllItems = () => {
      const { filterItems, existItems } = this.state;
      return R.uniqBy(R.prop('id'), _.concat(filterItems, existItems));
    };

    _onSortEnd = ({ oldIndex, newIndex }) => {
      const selectedItems = arrayMove(this.state.selectedItems, oldIndex, newIndex);
      onChange!(selectedItems);
      this.setState({ selectedItems });
    };

    // prettier-ignore
    _extractName = item => {
      if (enumSelector.name) {
        return R.compose(enumSelector.name, getValue)(item);
      }
      if (_.isArray((getValue as any)(item))) {
        return R.compose(R.prop(1), getValue)(item);
      }
      return (getName as any)(item);
    };

    // prettier-ignore
    _extractValue = item => {
      if (enumSelector.value) {
        return R.compose(enumSelector.value, getValue)(item);
      }
      if (_.isArray((getValue as any)(item))) {
        return R.compose(R.prop(0), getValue)(item);
      }
      return (getValue as any)(item);
    };

    _renderSortTree = () => {
      const { selectedItems } = this.state;

      const SortableItem = SortableElement<{ value: string; sortIndex: number }>(
        ({ value, sortIndex }) => {
          const item = this._getAllItems().find(current => current.id === value);
          const optionName = this._extractName(item);
          const optionValue = this._extractValue(item);
          return (
            <React.Fragment>
              <li>
                <span className="sort-index">No. {sortIndex}</span>
                {/* prettier-ignore */}
                <span>{'#'}{optionValue}{': '}{optionName}</span>
              </li>
              {/* language=CSS */}
              <style jsx>{`
                li {
                  position: relative;
                  display: block;
                  padding: 0.5rem 0.5rem 0.5rem 3.5rem;
                  margin: 0.5rem 0;
                  /*height: 2rem;*/
                  line-height: 1rem;
                  color: #000;
                  text-decoration: none;
                  border-radius: 0.2rem;
                  transition: all 0.1s ease-out;
                  box-shadow: 0 0 0.5rem grey;
                }

                li .sort-index {
                  position: absolute;
                  left: -1.3rem;
                  /*top: 50%;*/
                  top: 1rem;
                  margin-top: -1.3rem;
                  width: 4rem;
                  line-height: 2rem;
                  border: 0.3rem solid #fff;
                  text-align: center;
                  border-radius: 0.2rem;
                  background-color: white;
                  box-shadow: 0 0 0.5rem grey;
                }

                li:hover {
                  background: #d6d4d4;
                  text-decoration: none;
                  transform: scale(1.02);
                }
              `}</style>
            </React.Fragment>
          );
        },
      );
      const SortableList = SortableContainer<{ selectedSortedItems: any[] }>(
        ({ selectedSortedItems }) => (
          <React.Fragment>
            <ul>
              {selectedSortedItems.map((value, index) => (
                <SortableItem
                  key={`item-${Symbol(index).toString()}`}
                  index={index}
                  sortIndex={index}
                  value={value}
                />
              ))}
            </ul>
            {/* language=CSS */}
            <style jsx>{`
              ul {
                list-style: none;
                padding: 0;
                margin: 2rem;
              }
            `}</style>
          </React.Fragment>
        ),
      );

      return <SortableList selectedSortedItems={selectedItems} onSortEnd={this._onSortEnd} />;
    };

    _onChange = (value: any[]) => {
      const allExists = R.filter(item => R.contains(R.prop('id')(item))(value))(
        this._getAllItems(),
      );
      logger.log('[MixedSelect]', '[onChange]', { value, allExists });

      this.setState({ selectedItems: value, existItems: allExists });
    };

    _onSearch = (value: string): any => {
      if (onSearch) {
        const { existItems } = this.state;
        onSearch(value, items => {
          this.setState({ filterItems: _.concat(items, existItems) });
          logger.log('[MixedSelect]', '[onSearch]', { items });
        });
      }
    };

    render() {
      const { selectedItems } = this.state;

      logger.debug('[MixedSelect]', '[render]', { state: this.state, props: this.props });

      return (
        <React.Fragment>
          <Select
            {...this.props} // set extra properties from dynamic from here
            value={selectedItems as any} // value 为 null 时会显示一个空白框
            key={fieldName}
            showSearch
            allowClear
            // style={{ width: 300 }}
            placeholder={placeholder}
            optionFilterProp="children"
            mode={mode}
            onChange={this._onChange}
            onSearch={this._onSearch}
            filterOption={(input, option) => {
              // logger.log('filter item is', { input, option });
              const itemStr = R.join('', option.props.children).toLowerCase();
              return itemStr.indexOf(input.toLowerCase()) >= 0;
            }}
          >
            {this._getAllItems().map(item => {
              const optionName = this._extractName(item);
              const optionValue = this._extractValue(item);
              // prettier-ignore
              return (
                <Select.Option key={optionValue} value={optionValue}>
                  {'#'}{optionValue}{': '}{optionName}
                </Select.Option>
              );
            })}
          </Select>
          {withSortTree && this._renderSortTree()}
        </React.Fragment>
      );
    }
  }

  return generateComponent(form, { fieldName, labelName }, <MixedSelect />, formItemLayout);
}
