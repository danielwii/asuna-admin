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
   * 扩展模型定义
   */
  private _extraTableColumns: { [key: string]: Asuna.Schema.FRecordRender } = {};
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

  private _tableColumnOpts: { [key: string]: Asuna.Schema.TableColumnOpts<any> } = {};
  private _customActions: { [key in keyof T]?: React.Component[] } = {};

  private wrapTableColumns(
    key: string,
    opts: Asuna.Schema.TableColumnOpts<any>,
  ): { [key: string]: Asuna.Schema.FRecordRender } {
    return {
      [key]: (actions, extras) =>
        _.compact([
          commonColumns.primaryKeyByExtra(extras),
          ...Object.values(_.map(opts.columns, (func, key) => func(key, actions, extras))),
          commonColumns.updatedAt,
          ...[opts.enablePublished ? commonColumns.isPublished(extras) : null],
          opts.recordActions ? opts.recordActions(actions, extras) : commonColumns.actions(actions),
        ]),
    };
  }

  addModelOpts(modelOpts: { [key in keyof T]?: Asuna.Schema.ModelOpt<T> }): void {
    this._modelOpts = extend(this._modelOpts, modelOpts); // { ...this.modelOpts, ...modelOpts };
  }

  setupExtraTableColumns<EntitySchema>(
    key: string,
    opts: Asuna.Schema.TableColumnOpts<EntitySchema>,
  ): void {
    this._tableColumnOpts[key] = opts;
    this._extraTableColumns = extend(this._extraTableColumns, this.wrapTableColumns(key, opts));
  }

  setupTableColumns<EntitySchema>(
    entity: keyof T,
    opts: Asuna.Schema.TableColumnOpts<EntitySchema>,
  ): void {
    this._tableColumnOpts[entity as string] = opts;
    this._tableColumns = extend(this._tableColumns, this.wrapTableColumns(entity as string, opts));
  }

  /**
   * @deprecated {@see setupTableColumns}
   */
  addTableColumns(tableColumns: { [key in keyof T]?: Asuna.Schema.FRecordRender }): void {
    this._tableColumns = extend(this._tableColumns, tableColumns);
  }

  addCustomActions(model: keyof T, ...actions: React.Component[]): void {
    this._customActions = extend(this._customActions, { [model]: actions });
  }

  addModelColumns(modelsColumns: { [key in keyof T]?: Asuna.Schema.ModelColumn }): void {
    this._modelColumns = extend(this._modelColumns, modelsColumns);
  }

  addAssociations(associations: { [key in keyof T]?: Asuna.Schema.Association }): void {
    this._associations = extend(this._associations, associations);
  }

  setupSideMenus(
    key: string,
    title: string,
    subMenus: (
      | {
          key: keyof T;
          title: string;
          linkTo: 'content::index' | 'content::graph.index';
        }
      | {
          key: string;
          model: keyof T;
          title: string;
          linkTo: 'content::index' | 'content::graph.index';
        })[],
  ): void {
    this._sideMenus = [...this._sideMenus, { key: key as string, title, subMenus } as any];
  }

  /**
   * @deprecated {@see setupSideMenus}
   */
  addSideMenus(
    menus: {
      key: string;
      model?: string;
      title: string;
      subMenus: SubMenus<T>;
    }[],
  ): void {
    this._sideMenus = [...this._sideMenus, ...menus];
  }

  getModelConfig(key: keyof T): Asuna.Schema.ModelConfig {
    // 存在 extra 的配置时从 extra 中获取，否则获取默认配置
    const table = this._extraTableColumns[key as string] || this._tableColumns[key];
    const model = this._modelColumns[key];
    logger.log('getModelConfig', { key, table, model });
    if (!table) logger.warn('[getModelConfig]', key, 'should set table');
    // if (!model) logger.warn('[getModelConfig]', key, 'should set model');
    return { ...this._modelOpts[key], table, model };
  }

  get modelConfigs(): { [K: string]: Asuna.Schema.ModelConfig } {
    return _.compact([...Object.keys(this.modelOpts), ...Object.keys(this._extraTableColumns)])
      .map(key => ({ [key]: this.getModelConfig(key) }))
      .reduce((previous, current) => ({ ...previous, ...current }), {});
  }

  get modelOpts(): { [key in keyof T]?: Asuna.Schema.ModelOpt<T> } {
    return this._modelOpts;
  }

  get associations(): { [key in keyof T]?: Asuna.Schema.Association } {
    return this._associations;
  }

  get tableColumnOpts(): { [key: string]: Asuna.Schema.TableColumnOpts<any> } {
    return this._tableColumnOpts;
  }

  get sideMenus(): {
    key: string;
    title: string;
    subMenus: SubMenus<T>;
  }[] {
    return this._sideMenus;
  }
}
