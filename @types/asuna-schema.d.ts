declare namespace Asuna {
  declare namespace Schema {
    enum MetaInfoColumnType {
      IMAGE         = 'Image',
      IMAGES        = 'Images',
      VIDEO         = 'Video',
      VIDEOS        = 'Videos',
      AUTHORITIES   = 'Authorities',
      /**
       * 富文本
       */
      RICH_TEXT     = 'RichText',
      /**
       * Record: 标记记录是否可删除
       */
      DELETABLE     = 'Deletable',
      /**
       * 临时存放排序序列
       * @Deprecated 考虑更通用的排序方案
       */
      SORT_POSITION = 'SortPosition',
      /**
       * 目前有两个用途，根据 `enumData` 获的要筛选数据
       * 1 - 用于筛选不同类型的数据关联时使用
       *   e.g @MetaInfo({
       *         name: '类型',
       *         type: MetaInfoColumnType.ENUM_FILTER,
       *         filterType: MetaInfoFilterType.SORT,
       *         enumData: _.map(SortType, (value, key) => ({ key, value })),
       *       })
       *       @IsIn(_.keys(SortType))
       * 2 - 用于下拉菜单
       *   e.g @MetaInfo({
       *         name    : '位置',
       *         type    : MetaInfoColumnType.ENUM_FILTER,
       *         enumData: _.map(LocationType, (value, key) => ({ key, value })),
       *       })
       *       @IsOptional() // 可接受 null
       *       @IsIn(_.keys(LocationType))
       *       @Column('varchar', { nullable: true, name: 'location_type' })
       *       locationType: typeof LocationType;
       */
      ENUM_FILTER   = 'EnumFilter',
    }

    enum MetaInfoFilterType {
      SORT = 'Sort',
    }

    enum MetaInfoJsonType {
      STR = 'str',
    }

    enum MetaInfoAccessible {
      /**
       * Column: 标记该列只读
       */
      READONLY = 'readonly',
      /**
       * Column: 标记该列隐藏
       * @type {string}
       */
      HIDDEN   = 'hidden',
    }

    type MetaInfoOptions = {
      name?: string,
      type?: MetaInfoColumnType,
      json?: MetaInfoJsonType,
      /**
       * 修正前端更新数据的引用，`model_id` -> `model`
       * @deprecated 当更新字段和 schema 字段一致时无需设置，在当前框架中应该无需使用
       */
      ref?: string,
      help?: string,
      accessible?: MetaInfoAccessible,
      enumData?: { key: string, value: string[] }[],
      filterType?: MetaInfoFilterType,
    };

    type EntityMetaInfoOptions = { name: string };


    interface FRecordRender {
      (actions: () => any): any;
    }

    interface ModelConfig {
      table?: FRecordRender;
      model?: {};
    }

    type ModelConfigs = { [key: string]: ModelConfig };

    interface FormSchema {
      name: string;
      ref?: string;
      type: string;
      value: any;
      options: {
        label?: string;
        selectable?: string;
        required?: boolean;
        json?: string;
      };
    }

    type FormSchemas = { [key: string]: FormSchema };

    interface ModelSchema {
      name: string;
      config: {};
    }

    type ModelSchemas = { [key: string]: ModelSchema[] };

    interface Association {
      name?: string;
      value?: string;
      ref?: string;
      fields?: string[];
    }

    type Associations = { [key: string]: Association };

    interface ModelColumn {
      associations?: Associations,
      settings?: {
        [key: string]: {
          help?: string,
          accessible?: 'readonly' | 'hidden',
          /**
           * value is array =>  name: R.prop(1), value: R.prop(0)
           * value is string => value
           */
          enumSelector?: { name: string, value: string },
          target?: { enumSelector: { name: string, value: string } },
        },
      },
    }

    type ModelColumns = { [key: string]: ModelColumn };

    type TableColumns = { [key: string]: FRecordRender };

    interface ModelOpts {
      models?: {
        [key: string]: {
          endpoint?: string,
        }
      },
      tableColumns?: TableColumns,
      modelColumns?: ModelColumns,
    }

    interface SubMenu {
      key: string;
      title: string;
      linkTo: string;
    }

    interface Menu {
      key: string;
      title: string;
      subMenus: SubMenu[];
    }

    type Menus = Menu[];
  }
}
