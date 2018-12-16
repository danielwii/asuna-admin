declare module 'Asuna' {
  export = Asuna;
}

declare namespace Asuna {
  interface Pageable {
    page: number;
    size: number;
  }

  type Profile = 'detail' | 'ids';

  namespace Error {
    enum Code {
      /**
       * 对象格式验证异常
       */
      VALIDATE = 'VALIDATE',
      UPLOAD = 'UPLOAD',
      SIGN = 'SIGN',
      BAD_REQUEST = 'BAD_REQUEST',
    }

    interface Validate {
      children: object[];
      constraints: { [key: string]: string };
      property: string;
      target: { [key: string]: any };
      value: any;
    }

    interface Exception {
      status: 400 | 500;
      code: Code;
      errors: any[];
      message: string;
      name: string;
    }

    interface ValidationException extends Exception {
      status: 400;
      code: Code.VALIDATE;
      errors: Validate[];
    }

    interface AsunaException extends Exception {
      status: 500;
    }
  }

  namespace Schema {
    /**
     * @deprecated
     */
    enum MetaInfoColumnType {
      IMAGE = 'Image',
      IMAGES = 'Images',
      VIDEO = 'Video',
      VIDEOS = 'Videos',
      AUTHORITIES = 'Authorities',
      RICH_TEXT = 'RichText',
      DELETABLE = 'Deletable',
      SORT_POSITION = 'SortPosition',
      ENUM_FILTER = 'EnumFilter',
      ENUM = 'Enum',
    }

    /**
     * @deprecated
     */
    enum MetaInfoFilterType {
      SORT = 'Sort',
    }

    /**
     * @deprecated
     */
    enum MetaInfoJsonType {
      STR = 'str',
    }

    /**
     * @deprecated
     */
    enum MetaInfoAccessible {
      /**
       * Column: 标记该列只读
       */
      READONLY = 'readonly',
      /**
       * Column: 标记该列隐藏
       * @type {string}
       */
      HIDDEN = 'hidden',
    }

    interface UploadResponse {
      bucket: string;
      filename: string;
      mode: 'local' | 'qiniu';
      prefix: string;
    }

    type MetaInfoOptions = {
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
       *           filterType: MetaInfoFilterType.SORT,
       *           enumData: _.map(SortType, (value, key) => ({ key, value })),
       *         })
       *         @IsIn(_.keys(SortType))
       *   2 - 用于下拉菜单
       *     e.g @MetaInfo({
       *           name    : '位置',
       *           type    : MetaInfoColumnType.ENUM_FILTER,
       *           enumData: _.map(LocationType, (value, key) => ({ key, value })),
       *         })
       *         @IsOptional() // 可接受 null
       *         @IsIn(_.keys(LocationType))
       *         @Column('varchar', { nullable: true, name: 'location_type' })
       *         locationType: typeof LocationType;
       */
      type?:
        | MetaInfoColumnType
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
      json?: MetaInfoJsonType | 'str';
      /**
       * 修正前端更新数据的引用，`model_id` -> `model`
       * @deprecated 当更新字段和 schema 字段一致时无需设置，在当前框架中应该无需使用
       */
      ref?: string;
      help?: string;
      accessible?: MetaInfoAccessible | 'readonly' | 'hidden';
      enumData?: { key: string; value: string }[];
      filterType?: MetaInfoFilterType | 'Sort';
      /**
       * slash - 根据 / 设定层级结构
       * parent - 根据父类设定层级结构
       */
      treeType?: 'slash' | 'parent';
    };

    type EntityMetaInfoOptions = {
      name: string;
    };

    interface FRecordRender {
      (
        /**
         * 用于渲染额外的功能按钮
         */
        actions: () => any,
        opts: {
          auth: { token: string };
          modelName: string;
          /**
           * 用于处理完毕后的的页面刷新
           */
          callRefresh: () => void;
        },
      ): any;
    }

    interface ModelConfig extends ModelOpt {
      table?: FRecordRender;
      model?: ModelColumn;
    }

    /**
     * @deprecated
     */
    type ModelConfigs = { [key: string]: ModelConfig };

    interface FormSchema {
      name: string;
      ref?: string;
      type: string | null;
      value: any | null | undefined;
      options: MetaInfoOptions & {
        length: number | null;
        label?: string | null;
        selectable?: string | null;
        required?: boolean;
        json?: string;
      };
    }

    type FormSchemas = { [key: string]: FormSchema };

    interface ModelSchema {
      name: string;
      config: {
        selectable?: string;
        type: string;
        primaryKey?: boolean;
        nullable?: boolean;
        length?: string | number;
        info: MetaInfoOptions & {
          label?: string;
          selectable?: string;
          required?: boolean;
          json?: string;
        };
        many?: boolean;
      };
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
      associations?: Associations;
      settings?: {
        [key: string]: {
          help?: string;
          accessible?: 'readonly' | 'hidden';
          /**
           * value is array =>  name: R.prop(1), value: R.prop(0)
           * value is string => value
           */
          enumSelector?: { name: string; value: string };
          target?: { enumSelector: { name: string; value: string } };
        };
      };
    }

    // 单个模型设置，用于定义非 app 模块外的模型的访问端点
    type ModelOpts = { [key: string]: ModelOpt };

    interface ModelOpt {
      creatable?: boolean;
      endpoint?: string;
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
