declare module 'Asuna' {
  export = Asuna;
}

declare module Asuna {
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

  module Schema {
    interface UploadResponse {
      bucket: string;
      filename: string;
      mode: 'local' | 'qiniu';
      prefix: string;
    }

    // type EntityMetaInfoOptions = {
    //   name: string;
    // };

    interface FRecordRender {
      (
        /**
         * 用于渲染额外的功能按钮
         */
        actions: (text, record, extras) => any,
        opts: {
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

    type ForeignOpt = {
      modelName: string;
      association?: { name: string; value: string; fields: string[] };
      onSearch: (value: string) => any;
      onChange: (value: string) => any;
    };

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
      component?: string;
    }

    type Pane =
      | {
          key: string;
          title: string;
          linkTo: 'content::upsert' | 'content::insert';
          data?: { modelName; record } | any;
        }
      | {
          key: string;
          title: string;
          linkTo: 'content::blank';
          data?: { modelName; record } | any;
          component: string;
        };

    interface Menu {
      key: string;
      title: string;
      subMenus: SubMenu[];
    }

    type Menus = Menu[];
  }
}
