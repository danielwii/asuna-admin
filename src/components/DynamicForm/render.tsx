import useLogger from '@danielwii/asuna-helper/dist/logger/hooks';

import * as _ from 'lodash';
import * as R from 'ramda';
import * as React from 'react';
import * as util from 'util';

import { AppContext } from '../../core/context';
import { WithDebugInfo } from '../../helpers/debug';
import { createLogger } from '../../logger';
import {
  GenerateOptions,
  HiddenOptions,
  InputOptions,
  PlainOptions,
  generateAuthorities,
  generateCheckbox,
  generateDateTime,
  generateGenerate,
  generateHidden,
  generateInput,
  generateInputNumber,
  generatePlain,
  generateRichTextEditor,
  generateStringTmpl,
  generateSwitch,
  generateTextArea,
  generateVideo,
} from './elements';
import { generateAddress } from './elements/Address';
import { generateFile, generateFiles } from './elements/Files';
import { generateImage, generateImages, generateRichImage } from './elements/Image';
import { generateKVArray } from './elements/KVArray';
import { PlainImages } from './elements/Plain';
import { Item, generateSelect } from './elements/Select';
import { StringArrayOptions, generateStringArray } from './elements/StringArray';
import { DynamicFormTypes } from './types';

import type { EnumFilterMetaInfoOptions, MetaInfoOptions } from '@danielwii/asuna-shared';
import type { FormInstance } from 'antd';
import type { Asuna } from '../../types';

const logger = createLogger('components:dynamic-form:render');

export type DynamicFormFieldOptions = Partial<MetaInfoOptions> & {
  required?: boolean;
  tooltip?: string;
  label?: string;
  // name?: string;
};

export type DynamicFormField = {
  name: string;
  type: DynamicFormTypes;
  foreignOpts?: Asuna.Schema.ForeignOpt[];
  options?: DynamicFormFieldOptions;
  ref?: string;
  key?: string;
  raw?: any[];
  value?: any | any[];
};

interface RenderedFieldProps {
  model: string;
  schema?: Asuna.Schema.OriginSchema;
  form: FormInstance;
  fields: FormField[];
  field: DynamicFormField;
}

export const RenderedField: React.FC<RenderedFieldProps> = ({ model, schema, form, fields, field }) => {
  field.options = field.options || {};
  const options: DeepPartial<
    DynamicFormField['options'] &
      HiddenOptions &
      PlainOptions &
      GenerateOptions &
      InputOptions &
      // SelectOptions & // will cause never type issue
      StringArrayOptions
  > = {
    ...field.options,
    // key: field.key ?? field.name,
    name: field.name,
    label: field.options.name ?? field.name,
    help: field.options.tooltip ?? field.options.help,
  };
  const defaultAssociation = { name: 'name', value: 'id', fields: ['id', 'name'] };

  useLogger(`RenderedField(key=${field.name})`, { field, options, accessible: field?.options?.accessible });

  // all readonly or hidden field will be rendered as plain component
  if (_.includes(['readonly'], field?.options?.accessible)) {
    if (field.type === DynamicFormTypes.Images) {
      return (
        <PlainImages
          options={{
            text: _.defaultTo(field.value, options.defaultValue),
            ...(options as PlainOptions),
          }}
        />
      );
    } else if (field.type === DynamicFormTypes.Switch) {
      return generateSwitch(form, { ...options, readonly: true });
    }
    return generatePlain({
      text: _.defaultTo(field.value, options.defaultValue),
      ...options,
    } as PlainOptions);
  }
  if (_.includes(['hidden'], field?.options?.accessible)) {
    // return generatePlain({ text: <i>hidden</i>, ...(options as PlainOptions) });
    return null;
  }

  logger.log('[DynamicForm]', '[buildField]', field, { options, schema });

  switch (field.type) {
    case DynamicFormTypes.Plain:
      return generatePlain({ text: field.value, ...options } as PlainOptions);
    case DynamicFormTypes.Input:
      if (options.length && options.length > 200) {
        return generateTextArea({ form, fields, field }, options);
      }
      return generateInput({ form, fields, field }, options as InputOptions);
    case DynamicFormTypes.Address:
      return generateAddress(form, options as InputOptions);
    case DynamicFormTypes.Checkbox:
      return generateCheckbox(form, options);
    case DynamicFormTypes.Hidden:
      return generateHidden(form, options as HiddenOptions);
    case DynamicFormTypes.InputNumber:
      return generateInputNumber(form, options);
    case DynamicFormTypes.StringTmpl:
      return generateStringTmpl(form, options);
    case DynamicFormTypes.JSON:
    // return generateTextArea(form, options);
    case DynamicFormTypes.Generate:
      return generateGenerate({ form, fields, field }, options as DynamicFormField['options'] & GenerateOptions);
    case DynamicFormTypes.TextArea:
      return generateTextArea({ form, fields, field }, options);
    case DynamicFormTypes.DateTime:
      return generateDateTime(form, options);
    case DynamicFormTypes.Date:
      return generateDateTime(form, { ...options, mode: 'date' });
    case DynamicFormTypes.Video:
      return generateVideo(form, options);
    case DynamicFormTypes.Authorities:
      return generateAuthorities(form, options);
    case DynamicFormTypes.RichImage:
      return generateRichImage(form, fields, options);
    case DynamicFormTypes.Image:
      return generateImage(form, options);
    case DynamicFormTypes.Images:
      return generateImages(form, options);
    case DynamicFormTypes.File:
      return generateFile(form, options);
    case DynamicFormTypes.Files:
      return generateFiles(form, options);
    case DynamicFormTypes.Deletable:
    case DynamicFormTypes.Switch:
      return generateSwitch(form, options);
    case DynamicFormTypes.RichText:
      return generateRichTextEditor(form, options);
    case DynamicFormTypes.ManyToMany: {
      // --------------------------------------------------------------
      // ManyToMany RelationShip
      // --------------------------------------------------------------
      logger.debug('[DynamicForm]', '[buildField][ManyToMany]', { field });
      if (field.foreignOpts) {
        const { modelName, association = defaultAssociation, onSearch } = field.foreignOpts[0];

        const items = R.path(['associations', modelName, 'items'])(field);
        const existItems = R.path(['associations', modelName, 'existItems'])(field);
        const type = (field.options as EnumFilterMetaInfoOptions)?.filterType;
        const getName = R.ifElse(
          _.isString,
          (v) => R.prop(v),
          (v) => v,
        )(association.name ?? defaultAssociation.name);
        const getValue = R.ifElse(
          _.isString,
          (v) => R.prop(v),
          (v) => v,
        )(association.value ?? defaultAssociation.value);
        return generateSelect(form, {
          ...(options as any),
          items,
          existItems,
          mode: 'multiple',
          withSortTree: type === 'Sort',
          onSearch,
          getName,
          getValue,
          field,
        });
      }
      logger.warn('[buildField]', 'foreignOpts is required in association.', { field });
      return <div>association({util.inspect(field)}) need foreignOpts.</div>;
    }
    case DynamicFormTypes.Enum:
    case DynamicFormTypes.EditableEnum:
      // --------------------------------------------------------------
      // Enum / RelationShip
      // --------------------------------------------------------------
      logger.debug('[DynamicForm]', '[buildField][EditableEnum]', { model }, field);
    //   const items = R.path(['options', 'enumData'])(field);
    //   return generateSelect(form, {
    //     ...options,
    //     items,
    //     getName: R.prop('key'),
    //   } as SelectOptions);
    // }
    case DynamicFormTypes.EnumFilter: {
      let onInit;
      if (field.type === DynamicFormTypes.EditableEnum) {
        onInit = async (): Promise<Item[]> => {
          try {
            const existItems = await AppContext.ctx.models.uniq(model, field.name);
            logger.debug('[DynamicForm]', '[buildField][EditableEnum]', field, { existItems });
            return _.map(existItems, (key) => ({ value: key, key }));
          } catch (reason) {
            logger.error('[DynamicForm]', '[buildField][EditableEnum]', reason);
            return [];
          }
        };
      }
      // --------------------------------------------------------------
      // EnumFilter|Enum / RelationShip
      // --------------------------------------------------------------
      logger.log('[DynamicForm]', '[buildField][EnumFilter|Enum]', { field });
      const enumData = (field.options as EnumFilterMetaInfoOptions)?.enumData || {};
      const items: Item[] = _.map(enumData, (value, key) => ({ key, value: [key, value] }));
      const type = (field.options as EnumFilterMetaInfoOptions)?.filterType;
      logger.log('[DynamicForm]', '[buildField][EnumFilter|Enum]', { type, items });
      return generateSelect(form, {
        ...(options as any),
        onInit,
        items,
        getName: R.prop('key'),
        editable: field.type === DynamicFormTypes.EditableEnum,
      });
    }
    case DynamicFormTypes.Association: {
      // --------------------------------------------------------------
      // OneToMany / OneToOne RelationShip
      // --------------------------------------------------------------
      logger.debug('[DynamicForm]', '[buildField][Association]', field);
      if (R.has('foreignOpts')(field)) {
        const {
          modelName,
          association = defaultAssociation,
          onSearch,
        } = R.path(['foreignOpts', 0])(field) as Asuna.Schema.ForeignOpt;

        const items = R.path(['associations', modelName, 'items'])(field);
        const existItems = R.path(['associations', modelName, 'existItems'])(field);
        const getName = R.ifElse(
          _.isString,
          (v) => R.prop(v),
          (v) => v,
        )(association.name ?? defaultAssociation.name);
        const getValue = R.ifElse(
          _.isString,
          (v) => R.prop(v),
          (v) => v,
        )(association.value ?? defaultAssociation.value);
        return generateSelect(form, { ...(options as any), items, existItems, onSearch, getName, getValue, field });
      }
      logger.warn('[DynamicForm]', '[buildField]', 'foreignOpts is required in association.', { field });
      return <div>association({util.inspect(field)}) need foreignOpts.</div>;
    }
    case DynamicFormTypes.SimpleJSON: // TODO json-type is string-array
      logger.info('[DynamicForm]', '[buildField][SimpleJSON]', field, options);
      if ((options as any).jsonType === 'kv-array') {
        return generateKVArray(form, { ...(options as any), items: field.value });
      }
      return generateStringArray(form, {
        ...(options as any),
        items: field.value,
        mode: (options as any).jsonType === 'tag-array' ? 'tag' : 'input',
      });
    default: {
      return (
        <WithDebugInfo key={field.name} info={field}>
          DynamicForm not implemented. :P
          <pre>{util.inspect({ field, options })}</pre>
        </WithDebugInfo>
      );
    }
  }
};
