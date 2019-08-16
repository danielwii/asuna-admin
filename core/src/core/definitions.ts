import { commonColumns, extend } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';
import { Asuna } from '@asuna-admin/types';
import * as _ from 'lodash';
import * as React from 'react';

const logger = createLogger('core:definition');

type SubMenus<T extends Asuna.Schema.ModelOpts = {}> = (
  | Asuna.Schema.SubMenu
  | {
      key: keyof T;
      model?: string;
      title: string;
      linkTo: 'content::index' | 'content::graph.index';
    })[];

export class AsunaDefinitions<T extends Asuna.Schema.ModelOpts = {}> {
  /**
   * 基础模型定义
   */
  private _modelOpts: { [key in keyof T]?: Asuna.Schema.ModelOpt<T> } = {};
  /**
   * 模型列表页配置
   * @type {{colleges: function(*=): *[], countries: function(*=): *[]}}
   */
  private _tableColumns: { [key in keyof T]?: Asuna.Schema.FRecordRender } = {};
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
  private _modelColumns: { [key in keyof T]?: Asuna.Schema.ModelColumn } = {};
  /**
   * 描述关联下拉菜单的查询可显示字段
   */
  private _associations: { [key in keyof T]?: Asuna.Schema.Association } = {};
  /**
   * 定义左侧导航条
   * @type {*[]}
   */
  private _sideMenus: {
    key: string;
    title: string;
    subMenus: SubMenus<T>;
  }[] = [];

  private _customActions: { [key in keyof T]?: React.Component[] } = {};

  addModelOpts(modelOpts: { [key in keyof T]?: Asuna.Schema.ModelOpt<T> }) {
    this._modelOpts = extend(this._modelOpts, modelOpts); // { ...this.modelOpts, ...modelOpts };
  }

  setupTableColumns<EntitySchema>(
    entity: keyof T,
    opts: {
      enablePublished?: boolean;
      columns: {
        [key in keyof EntitySchema]: (key, actions, extras) => Asuna.Schema.FRecordRender;
      };
    },
  ) {
    this._tableColumns = extend(this._tableColumns, {
      [entity]: (actions, extras) =>
        _.compact([
          commonColumns.primaryKeyByExtra(extras),
          ...Object.values(_.map(opts.columns, (func, key) => func(key, actions, extras))),
          commonColumns.updatedAt,
          ...[opts.enablePublished ? commonColumns.isPublished(extras) : null],
          commonColumns.actions(actions),
        ]),
    });
  }

  /**
   * @deprecated {@see setupTableColumns}
   */
  addTableColumns(tableColumns: { [key in keyof T]?: Asuna.Schema.FRecordRender }) {
    this._tableColumns = extend(this._tableColumns, tableColumns);
  }

  addCustomActions(model: keyof T, ...actions: React.Component[]) {
    this._customActions = extend(this._customActions, { [model]: actions });
  }

  addModelColumns(modelsColumns: { [key in keyof T]?: Asuna.Schema.ModelColumn }) {
    this._modelColumns = extend(this._modelColumns, modelsColumns);
  }

  addAssociations(associations: { [key in keyof T]?: Asuna.Schema.Association }) {
    this._associations = extend(this._associations, associations);
  }

  setupSideMenus(
    key: string,
    title: string,
    subMenus: {
      key: keyof T;
      model?: string;
      title: string;
      linkTo: 'content::index' | 'content::graph.index';
    }[],
  ) {
    this._sideMenus = [...this._sideMenus, { key: key as string, title, subMenus } as any];
  }

  /**
   * @deprecated {@see setupTableColumns}
   */
  addSideMenus(
    menus: {
      key: string;
      model?: string;
      title: string;
      subMenus: SubMenus<T>;
    }[],
  ) {
    this._sideMenus = [...this._sideMenus, ...menus];
  }

  getModelConfig(key: keyof T): Asuna.Schema.ModelConfig {
    const table = this._tableColumns[key];
    const model = this._modelColumns[key];
    if (!table) logger.warn('[getModelConfig]', key, 'should set table');
    if (!model) logger.warn('[getModelConfig]', key, 'should set model');
    return { ...this._modelOpts[key], table, model };
  }

  get modelConfigs(): { [K: string]: Asuna.Schema.ModelConfig } {
    return Object.keys(this.modelOpts)
      .map(key => {
        return { [key]: this.getModelConfig(key) };
      })
      .reduce((previous, current) => ({ ...previous, ...current }), {});
  }

  get modelOpts() {
    return this._modelOpts;
  }

  get tableColumns() {
    return this._tableColumns;
  }

  get modelColumns() {
    return this._modelColumns;
  }

  get associations() {
    return this._associations;
  }

  get sideMenus() {
    return this._sideMenus;
  }
}
