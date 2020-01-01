import { AppContext } from '@asuna-admin/core';
import { createLogger } from '@asuna-admin/logger';

import { Select } from 'antd';
import { WrappedFormUtils } from 'antd/es/form/Form';
import * as _ from 'lodash';
import * as R from 'ramda';
import * as React from 'react';
import { arrayMove, SortableContainer, SortableElement } from 'react-sortable-hoc';

import { generateComponent, horizontalFormItemLayout, IFormItemLayout } from '.';

const logger = createLogger('components:dynamic-form:select');

interface IMixedSelectProps {
  value?: any[];
  onChange?: (value) => void;
}

interface IMixedSelectState<T> {
  selectedItems: T[];
  filterItems: T[];
  existItems: T[];
  loading: boolean;
}

type ObjectItem = { [key: string]: any } & { id?: string | number; key?: string | number };
type ArrayItem = [any, any];
export type Item = ObjectItem | ArrayItem;

export type SelectOptions = {
  key: string;
  name: string;
  label: string;
  placeholder: string;
  items: Item[];
  existItems?: Item[];
  mode: 'default' | 'multiple' | 'tags' | 'combobox';
  getName: () => string;
  getValue: () => string;
  withSortTree: boolean;
  filterType?: 'Sort';
  onSearch?: (value: string, cb: (items: Item[]) => void) => any;
  enumSelector: { name?: string; value?: string };
};

const defaultFormItemLayout = {};

// prettier-ignore
const rNotNil = R.compose(R.not, R.isNil);

/**
 * if item is an Array - check the first value is unique
 * if item is an Object - check the value for first key is unique, there is embed order: id/key/else
 * @param items
 */
export const uniqueItems = (...items: Item[][]): Item[] => {
  const allItems = _.concat([], ...items);
  let result = [];
  if (allItems && _.isArray(allItems)) {
    const first = _.head(allItems);
    if (_.isArray(first)) {
      result = R.filter(rNotNil)(R.uniqBy(R.prop(0), allItems));
    } else if (_.isObject(first)) {
      const uniqBy = R.uniqBy(item => {
        return R.prop('id', item) || R.prop('key', item) || R.prop(_.head(R.keys(item)), item);
      }, allItems);
      result = R.filter(rNotNil)(uniqBy);
    } else if (_.isNil(first)) {
      // skip
    } else {
      logger.warn('[uniqueItems]', 'items type not recognised', { allItems, first });
    }
  }
  return result;
};

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
    onSearch,
    enumSelector = {},
  }: SelectOptions,
  formItemLayout: IFormItemLayout = horizontalFormItemLayout,
) {
  const fieldName = key || name;
  const labelName = label || name || key;
  logger.debug('[generateSelect]', { items, enumSelector });

  class MixedSelect extends React.Component<IMixedSelectProps, IMixedSelectState<Item>> {
    constructor(props) {
      super(props);

      logger.debug('[MixedSelect]', '[constructor]', this.props);
      this.state = {
        selectedItems: this.props.value || [],
        filterItems: _.compact(items) || [],
        existItems: _.compact(existItems) || [],
        loading: false,
      };
    }

    _getAllItems = () => {
      const { filterItems, existItems } = this.state;
      return uniqueItems(filterItems, existItems);
    };

    _onSortEnd = ({ oldIndex, newIndex }) => {
      const { onChange } = this.props;
      const selectedItems = arrayMove(this.state.selectedItems, oldIndex, newIndex);
      logger.debug('[_onSortEnd]', { selectedItems, oldIndex, newIndex });
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

      const SortableItem = SortableElement<{ value: string; sortIndex: number }>(({ value, sortIndex }) => {
        // TODO 目前只支持 ObjectItem 且通过 id 判断排序组件，理论上，该排序也可能应用在非 EnumFilter 下且不通过 id 判断的情况
        const primaryKey = AppContext.adapters.models.getPrimaryKey(name);
        const item = this._getAllItems().find((current: ObjectItem) => current[primaryKey] === value);
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
      });
      const SortableList = SortableContainer<{ selectedSortedItems: any[] }>(({ selectedSortedItems }) => (
        <React.Fragment>
          <ul>
            {selectedSortedItems.map((value, index) => (
              <SortableItem key={`item-${Symbol(index).toString()}`} index={index} sortIndex={index} value={value} />
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
      ));

      return <SortableList selectedSortedItems={selectedItems} onSortEnd={this._onSortEnd} />;
    };

    _onChange = (value: any | any[]) => {
      logger.log('[MixedSelect]', '[onChange]', { value, items: this._getAllItems() });
      const exists = value ? R.filter(item => R.contains(R.prop('id')(item))(value))(this._getAllItems()) : undefined;
      logger.log('[MixedSelect]', '[onChange]', { exists });

      this.setState({ existItems: exists });
      this.props.onChange!(value);
    };

    _onSearch = (value: string): any => {
      if (onSearch) {
        const { existItems } = this.state;
        this.setState({ loading: true });
        logger.log('[MixedSelect]', '[onSearch] call', { value });
        onSearch(value, items => {
          const filterItems = _.concat(items, existItems);
          logger.log('[MixedSelect]', '[onSearch]', { items, filterItems });
          this.setState({ loading: false, filterItems });
        });
      }
    };

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
      logger.error(error, errorInfo);
    }

    render() {
      const items = this._getAllItems();
      logger.debug('[MixedSelect]', '[render]', { state: this.state, props: this.props, items });

      const renderedItems = items.map(item => {
        const optionName = this._extractName(item);
        const optionValue = this._extractValue(item);
        // prettier-ignore
        return (
          <Select.Option key={optionValue} value={optionValue} title={`${optionValue}-${optionName}`}>
            {'#'}{optionValue}{': '}<span style={{fontWeight: 'bold'}}>{optionName}</span>
          </Select.Option>
        );
      });

      return (
        <React.Fragment>
          <Select
            {...this.props} // set extra properties from dynamic from here
            value={this.props.value}
            key={fieldName}
            showSearch
            allowClear
            // style={{ width: 300 }}
            placeholder={placeholder}
            // optionFilterProp="children"
            mode={mode}
            onChange={this._onChange}
            onSearch={_.debounce(value => this._onSearch(value), 500)}
            filterOption={false}
            /*
            filterOption={
              this.state.loading
                ? false
                : _.debounce((input, option) => {
                    const itemStr = option.props.title.toLowerCase();
                    const included = itemStr.toLowerCase().includes(input.toLowerCase());
                    logger.log('filter item is', { input, option, itemStr, included });
                    return included;
                  }, 200)
            }
            dropdownRender={menu => {
              logger.log('dropdownRender is', { menu });
              return (
                <div>
                  {menu}
                  <Divider style={{ margin: '4px 0' }}/>
                  <div style={{ padding: '8px', cursor: 'pointer' }}>
                    <Icon type="plus"/> Add item
                  </div>
                </div>
              );
            }}
*/
          >
            {renderedItems}
          </Select>
          {withSortTree && this._renderSortTree()}
        </React.Fragment>
      );
    }
  }

  return generateComponent(form, { fieldName, labelName }, <MixedSelect />, formItemLayout);
}
