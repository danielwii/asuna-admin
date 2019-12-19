import { DataViewColumnProps, DynamicFormTypes } from '@asuna-admin/components';
import { QueryFieldsColumnProps } from '../modules/content/query';
import { ColumnProps } from 'antd/es/table';
import * as React from 'react';
import { MetaInfoOptions } from './meta';

export declare module Asuna {
  interface Pageable {
    page: number;
    size: number;
  }

  type Profile = 'detail' | 'ids';

  module Error {
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

    interface ErrorResponse {
      error: Exception;
    }

    interface Exception {
      status: number;
      code: string;
      errors: any[];
      message: string;
      name: string;
    }

    interface ValidationException extends Exception {
      code: Code.VALIDATE;
      details: Validate[];
      name: string;
    }

    interface AsunaException extends Exception {}
  }

  module Schema {
    interface UploadResponse {
      bucket: string;
      extension: string;
      filename: string;
      fullpath: string;
      mimetype: string;
      mode: 'local' | 'qiniu';
      path: string;
      prefix: string;
    }

    // type EntityMetaInfoOptions = {
    //   name: string;
    // };

    type RecordRenderActions = (text, record, extras) => any;
    type RecordRenderExtras = {
      modelName: string;
      /**
       * 用于处理完毕后的的页面刷新
       */
      callRefresh: () => void;
    };

    interface FRecordRender {
      (
        /**
         * 用于渲染额外的功能按钮
         */
        actions: RecordRenderActions,
        opts: RecordRenderExtras,
      ): any;
    }

    interface ModelConfig extends ModelOpt<any> {
      table?: FRecordRender;
      model?: ModelColumn;
    }

    type ForeignOpt = {
      modelName: string;
      association?: { name: string; value: string; fields: string[] };
      onSearch: (value: string) => any;
      onChange: (value: string) => any;
    };

    interface FormSchema {
      name: string;
      ref?: string;
      type?: DynamicFormTypes;
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

    interface EntityInfo {
      name: string;
      displayName?: string;
    }

    interface OriginSchema {
      info?: EntityInfo;
      columns: ModelSchema[];
      manyToManyRelations: ModelSchema[];
      manyToOneRelations: ModelSchema[];
      oneToManyRelations: ModelSchema[];
    }

    interface Association {
      name?: string;
      value?: string;
      ref?: string;
      fields?: string[];
    }

    type Associations = { [key: string]: Association };

    type TableColumnOptCreatable = boolean | ((key: string, actions?, extras?) => void);

    type ColumnOpts<EntitySchema> = TableColumnOpts<EntitySchema> & ViewColumnProps<EntitySchema>;

    type ViewColumnProps<EntitySchema> = {
      columnProps?: {
        dataView?: DataViewColumnProps<EntitySchema>;
        queryFields?: QueryFieldsColumnProps<EntitySchema>;
      };
    };

    type TableColumnOpts<EntitySchema> = {
      creatable?: TableColumnOptCreatable;
      editable?: boolean;
      deletable?: boolean;
      enablePublished?: boolean;
      renderHelp?: React.ReactChild;
      renderActions?: (extras: RecordRenderExtras) => React.ReactChild;
      recordActions?: (actions: RecordRenderActions, extras: RecordRenderExtras) => void;
      rowClassName?: (record: any, index: number) => string;
      customColumns?: {
        [key: string]: (
          key: string,
          actions: RecordRenderActions,
          extras: RecordRenderExtras,
        ) => ColumnProps<any> | Promise<ColumnProps<any>>;
      };
      columns: {
        [key in keyof EntitySchema]: (
          key: string,
          actions: RecordRenderActions,
          extras: RecordRenderExtras,
        ) => ColumnProps<any> | Promise<ColumnProps<any>>;
      };
    };

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

    interface ModelOpt<T> {
      creatable?: boolean;
      endpoint?: string;
      columns?: {
        [key in keyof T]: {
          editor: (fields: any) => string;
        };
      };
    }

    // 单个模型设置，用于定义非 app 模块外的模型的访问端点
    type ModelOpts = { [key: string]: ModelOpt<any> | undefined };

    type SubMenus<T extends ModelOpts = {}> = SubMenu<T>[];
    type SubMenu<T extends ModelOpts = {}> = ComponentSubMenu | NormalSubMenu<T> | ModelSubMenu<T>;

    type ComponentSubMenu = {
      key: string;
      model?: string;
      group?: string;
      title: string;
      linkTo: string;
      component?: string;
    };

    type NormalSubMenu<T extends ModelOpts = {}> = {
      key: keyof T;
      title: string;
      linkTo: 'content::index' | 'content::graph.index';
    };

    /*
     * 用于模型可能重复时的定义
     */
    type ModelSubMenu<T extends ModelOpts = {}> = {
      key: keyof T;
      model?: string;
      title: string;
      linkTo: 'content::index' | 'content::graph.index';
    };

    type Pane =
      | {
          key: string;
          model?: string;
          title: string;
          linkTo: 'content::upsert' | 'content::insert' | 'content::query';
          data?: { modelName; record } | any;
        }
      | {
          key: string;
          model?: string;
          title: string;
          linkTo: 'content::blank';
          data?: { modelName; record } | any;
          component: string;
        };

    interface Menu<T extends ModelOpts = {}> {
      key: string;
      title: string;
      subMenus: SubMenus<T>;
    }
  }
}
