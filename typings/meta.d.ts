export type ColumnTypes =
  | 'Image'
  | 'Images'
  | 'Video'
  | 'Videos'
  | 'Authorities'
  | 'RichText'
  | 'Deletable'
  | 'SortPosition'
  | 'EnumFilter'
  | 'Enum'
  | 'Tree';

export type EntityMetaInfoOptions = {
  /**
   * ServerSide: 用于外键关联的识别名称
   */
  name: string;
};

export type MetaInfoOptions = {
  /**
   * 在 schema 中隐藏
   */
  ignore?: boolean;
  name?: string;
  /**
   * RichText - 富文本
   * Record - 标记记录是否可删除
   * SortPosition - 临时存放排序序列 @Deprecated 需要考虑更通用的排序方案
   * EnumFilter - 目前有两个用途，根据 `enumData` 获的要筛选数据
   *   1 - 用于筛选不同类型的数据关联时使用
   *     e.g @MetaInfo({
   *           name: '类型',
   *           type: MetaInfoColumnType.ENUM_FILTER,
   *           filterType: 'sort',
   *           enumData: _.map(SortType, (value, key) => ({ key, value })),
   *         })
   *         @IsIn(_.keys(SortType))
   *   2 - 用于下拉菜单
   *     e.g @MetaInfo({
   *           name    : '位置',
   *           type    : 'EnumFilter',
   *           enumData: _.map(LocationType, (value, key) => ({ key, value })),
   *         })
   *         @IsOptional() // 可接受 null
   *         @IsIn(_.keys(LocationType))
   *         @Column('varchar', { nullable: true, name: 'location_type' })
   *         locationType: typeof LocationType;
   */
  type?: ColumnTypes;
  json?: 'str';
  /**
   * 修正前端更新数据的引用，`model_id` -> `model`
   * @deprecated 当更新字段和 schema 字段一致时无需设置，在当前框架中应该无需使用
   */
  ref?: string;
  help?: string;
  /**
   * readonly - 标记该列只读
   * hidden - 标记该列隐藏
   */
  accessible?: 'readonly' | 'hidden';
  enumData?: { key: string; value: string[] }[];
  filterType?: 'Sort';
  /**
   * slash - 根据 / 设定层级结构
   * parent - 根据父类设定层级结构
   */
  treeType?: 'slash' | 'parent';
};

/**
 * 为对象附加 `info` 信息
 * @param options
 * @returns {Function}
 * @constructor
 */
export function ColumnMetaInfo(options: MetaInfo.MetaInfoOptions): Function {
  return function(target, propertyKey: string, descriptor: PropertyDescriptor) {
    target.info = { ...target.info, [propertyKey]: options };
  };
}

export function EntityMetaInfo(options: MetaInfo.EntityMetaInfoOptions): Function {
  return function(target, propertyKey: string, descriptor: PropertyDescriptor) {
    target.entityInfo = options;
  };
}
