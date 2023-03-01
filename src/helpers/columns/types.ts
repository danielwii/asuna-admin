import * as React from 'react';

import type { ColumnProps } from 'antd/es/table';
import type { Asuna } from '../../types/asuna';
import type { ParseType } from './utils';

export type RelationColumnProps<T = any> = ColumnProps<T> & { relation: string };

export type ConditionType = 'like' | 'boolean' | 'list';
export interface SwitchConditionExtras {
  model: string;
  relationSearchField?: string;
  items?: string[]; // for list condition
}
export interface ModelOpts {
  model: string;
  title?: string;
  ctx: Asuna.Schema.TableContext;
}
export interface TextColumnOpts {
  mode?: 'html' | 'json' | 'text' | 'button';
  /**
   * 用提供的转换器来转译
   */
  parseBy?: ParseType;
  /**
   * 内容修正
   */
  transformer?: ((record) => string) | string;
  searchType?: ConditionType;
  /**
   * 自定义渲染
   * @param content
   * @param record
   */
  render?: (content, record?) => React.ReactElement | string;
}
