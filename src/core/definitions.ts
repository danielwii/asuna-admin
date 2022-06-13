import * as _ from 'lodash';
import * as React from 'react';

import { commonColumns } from '../helpers/columns/common';
import { extend } from '../helpers/func';
import { createLogger } from '../logger';

import type { Asuna } from '../types';

const logger = createLogger('core:definition');

export class AsunaDefinitions<T extends Asuna.Schema.ModelOpts = {}> {
  /**
   * 基础模型定义
   */
  #modelOpts: { [key in keyof T]?: Asuna.Schema.ModelOpt<T> } = {};
  /**
   * 模型列表页配置
   * @type {{colleges: function(*=): *[], countries: function(*=): *[]}}
   */
  #tableColumns: { [key in keyof T]?: Asuna.Schema.FRecordRender } = {};
  /**
   * 扩展模型定义
   */
  #extraTableColumns: { [key: string]: Asuna.Schema.FRecordRender } = {};
  /**
   * 模型新增 / 编辑页面配置
   * fields 用于定义要获取的属性列表，用于减少消息体
   * default:
   *   [model]:
   *     associations:
   *       [association]:
   *         name: 'name',
   *         value: 'id',
   *         ref: 'association-ref-name',
   *         fields: ['id', 'name'],
   */
  #modelColumns: { [key in keyof T]?: Asuna.Schema.ModelColumn } = {};
  /**
   * 描述关联下拉菜单的查询可显示字段
   */
  #associations: { [key in keyof T]?: Asuna.Schema.Association } = {};
  /**
   * 定义左侧导航条
   * @type {*[]}
   */
  #sideMenus: Asuna.Schema.Menu<T>[] = [];
  #columnOpts: { [key: string]: Asuna.Schema.TableColumnOpts<any> } = {};
  #customActions: { [key in keyof T]?: React.Component[] } = {};

  private wrapTableColumns(
    entity: string,
    opts: Asuna.Schema.TableColumnOpts<any>,
  ): { [key: string]: Asuna.Schema.FRecordRender } {
    const columns = _.isFunction(opts.columns) ? opts.columns(entity) : opts.columns;
    return {
      [entity]: (actions, extras) =>
        _.compact([
          commonColumns.primaryKeyByExtra(extras),
          ...Object.values(_.map(columns, (func, key) => func(key, actions ?? {}, extras))),
          ...Object.values(_.map(opts.customColumns, (func, key) => func(key, actions ?? {}, extras))),
          commonColumns.updatedAt,
          commonColumns.createdAt,
          ...[opts.enablePublished ? commonColumns.isPublished(entity, extras) : null],
          opts.recordActions ? opts.recordActions(actions, extras) : commonColumns.actions(actions),
        ]),
    };
  }

  addModelOpts(modelOpts: { [key in keyof T]?: Asuna.Schema.ModelOpt<T> }): void {
    this.#modelOpts = extend(this.#modelOpts, modelOpts); // { ...this.modelOpts, ...modelOpts };
  }

  setupExtraTableColumns<EntitySchema>(key: string, opts: Asuna.Schema.ColumnOpts<EntitySchema>): void {
    const withStylesOpts = {
      ...opts,
      rowClassName:
        opts.rowClassName ??
        ((record) => (_.has(record, 'isPublished') ? (record.isPublished ? 'row-published' : 'row-unpublished') : '')),
    };
    this.#columnOpts[key] = withStylesOpts;
    this.#extraTableColumns = extend(this.#extraTableColumns, this.wrapTableColumns(key, withStylesOpts));
  }

  setupTableColumns<EntitySchema = any>(entity: keyof T, opts: Asuna.Schema.ColumnOpts<EntitySchema>): void {
    const withStylesOpts = {
      ...opts,
      rowClassName:
        opts.rowClassName ??
        ((record) => (_.has(record, 'isPublished') ? (record.isPublished ? 'row-published' : 'row-unpublished') : '')),
    };
    this.#columnOpts[entity as string] = withStylesOpts;
    this.#tableColumns = extend(this.#tableColumns, this.wrapTableColumns(entity as string, withStylesOpts));
  }

  /**
   * @deprecated {@see setupTableColumns}
   */
  addTableColumns(tableColumns: { [key in keyof T]?: Asuna.Schema.FRecordRender }): void {
    this.#tableColumns = extend(this.#tableColumns, tableColumns);
  }

  addCustomActions(model: keyof T, ...actions: React.Component[]): void {
    this.#customActions = extend(this.#customActions, { [model]: actions });
  }

  addModelColumns(modelsColumns: { [key in keyof T]?: Asuna.Schema.ModelColumn }): void {
    this.#modelColumns = extend(this.#modelColumns, modelsColumns);
  }

  addAssociations(associations: { [key in keyof T]?: Asuna.Schema.Association }): void {
    this.#associations = extend(this.#associations, associations);
  }

  setupSideMenus(key: string, title: string, subMenus: Asuna.Schema.SubMenus<T>): void {
    this.#sideMenus = [...this.#sideMenus, { key, title, subMenus } as any];
  }

  /**
   * @deprecated {@see setupSideMenus}
   */
  addSideMenus(
    menus: {
      key: string;
      model?: string;
      title: string;
      subMenus: Asuna.Schema.SubMenus<T>;
    }[],
  ): void {
    this.#sideMenus = [...this.#sideMenus, ...menus];
  }

  getModelConfig(key: keyof T): Asuna.Schema.ModelConfig {
    // 存在 extra 的配置时从 extra 中获取，否则获取默认配置
    const table = this.#extraTableColumns[key as string] || this.#tableColumns[key];
    const model = this.#modelColumns[key];
    logger.log('getModelConfig', { key, table, model });
    if (!table) logger.warn('[getModelConfig]', key, 'should set table');
    // if (!model) logger.warn('[getModelConfig]', key, 'should set model');
    return { ...this.#modelOpts[key], table, model };
  }

  get modelConfigs(): { [K: string]: Asuna.Schema.ModelConfig } {
    return _.compact([...Object.keys(this.modelOpts), ...Object.keys(this.#extraTableColumns)])
      .map((key) => ({ [key]: this.getModelConfig(key) }))
      .reduce((previous, current) => ({ ...previous, ...current }), {});
  }

  get modelOpts(): { [key in keyof T]?: Asuna.Schema.ModelOpt<T> } {
    return this.#modelOpts;
  }

  get associations(): { [key in keyof T]?: Asuna.Schema.Association } {
    return this.#associations;
  }

  get columnOpts(): { [key: string]: Asuna.Schema.ColumnOpts<any> } {
    return this.#columnOpts;
  }

  get sideMenus(): Asuna.Schema.Menu<T>[] {
    return this.#sideMenus;
  }

  static renders: { model: string; field: string; render: (content) => React.ReactNode }[] = [];

  regRender<EntitySchema>(model: keyof T, field: keyof EntitySchema, render: (content) => React.ReactNode) {
    AsunaDefinitions.renders.push({ model, field, render } as any);
  }
}
