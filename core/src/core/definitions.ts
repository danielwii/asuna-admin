import { extend } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';
import { Asuna } from '@asuna-admin/types';

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

  addModelOpts(modelOpts: { [key in keyof T]?: Asuna.Schema.ModelOpt<T> }) {
    this._modelOpts = extend(this._modelOpts, modelOpts); // { ...this.modelOpts, ...modelOpts };
  }

  addTableColumns(tableColumns: { [key in keyof T]?: Asuna.Schema.FRecordRender }) {
    this._tableColumns = extend(this._tableColumns, tableColumns);
  }

  addModelColumns(modelsColumns: { [key in keyof T]?: Asuna.Schema.ModelColumn }) {
    this._modelColumns = extend(this._modelColumns, modelsColumns);
  }

  addAssociations(associations: { [key in keyof T]?: Asuna.Schema.Association }) {
    this._associations = extend(this._associations, associations);
  }

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
