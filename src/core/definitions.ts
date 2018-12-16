import { extend } from '@asuna-admin/helpers';

export class AsunaDefinitions<T extends Asuna.Schema.ModelOpts = {}> {
  /**
   * 基础模型定义
   */
  private _modelOpts: { [key in keyof T]?: Asuna.Schema.ModelOpt } = {};
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
  private _modelsColumns: { [key in keyof T]?: Asuna.Schema.ModelColumn } = {};
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
    subMenus: (
      | Asuna.Schema.SubMenu
      | {
          key: keyof T;
          title: string;
          linkTo: 'content::index';
        })[];
  }[] = [];

  addModelOpts(modelOpts: { [key in keyof T]?: Asuna.Schema.ModelOpt }) {
    this._modelOpts = extend(this._modelOpts, modelOpts); // { ...this.modelOpts, ...modelOpts };
  }

  addTableColumns(tableColumns: { [key in keyof T]?: Asuna.Schema.FRecordRender }) {
    this._tableColumns = { ...this._tableColumns, ...tableColumns };
  }

  addModelColumns(modelsColumns: { [key in keyof T]?: Asuna.Schema.ModelColumn }) {
    // const columns = modelsColumns
    //   .map(modelColumns => ({ [modelColumns.key]: modelColumns.opts }))
    //   .reduce((previous, current) => ({ ...previous, ...current }), {});
    // this.modelsColumns = { ...this.modelsColumns, ...modelsColumns };
    this._modelsColumns = extend(this._modelsColumns, modelsColumns);
  }

  addAssociations(associations: { [key in keyof T]?: Asuna.Schema.Association }) {
    this._associations = extend(this._associations, associations);
  }

  addSideMenus(
    menus: {
      key: string;
      title: string;
      subMenus: (
        | Asuna.Schema.SubMenu
        | {
            key: keyof T;
            title: string;
            linkTo: 'content::index';
          })[];
    }[],
  ) {
    this._sideMenus = [...this._sideMenus, ...menus];
  }

  get modelOpts() {
    return this._modelOpts;
  }

  get tableColumns() {
    return this._tableColumns;
  }

  get modelColumns() {
    return this._modelsColumns;
  }

  get associations() {
    return this._associations;
  }

  get sideMenus() {
    return this._sideMenus;
  }
}
