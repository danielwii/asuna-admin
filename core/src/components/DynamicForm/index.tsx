import { diff } from '@asuna-admin/helpers';
import { WithDebugInfo } from '@asuna-admin/helpers/debug';
import { createLogger } from '@asuna-admin/logger';
import { Asuna } from '@asuna-admin/types';
import { EnumFilterMetaInfoOptions, MetaInfoOptions } from '@asuna-admin/types/meta';

import { Affix, Anchor, Button, Col, Form, Row, Tag } from 'antd';
import { FormComponentProps } from 'antd/es/form';
import idx from 'idx';
import _ from 'lodash';
import PropTypes from 'prop-types';
import * as R from 'ramda';
import React from 'react';
import { CircleLoader } from 'react-spinners';
import styled from 'styled-components';
import util from 'util';

import {
  generateAuthorities,
  generateCheckbox,
  generateDateTime,
  generateHidden,
  generateInput,
  generateInputNumber,
  generatePlain,
  generateRichTextEditor,
  generateSwitch,
  generateTextArea,
  generateVideo,
  HiddenOptions,
  InputOptions,
  PlainOptions,
} from './elements';
import { generateFile, generateFiles } from './elements/Files';
import { generateImage, generateImages, generateRichImage } from './elements/Image';
import { PlainImages } from './elements/Plain';
import { generateSelect, Item, SelectOptions } from './elements/Select';
import { generateStringArray, StringArrayOptions } from './elements/StringArray';

const logger = createLogger('components:dynamic-form');

const FixedLoading = styled(({ className }) => (
  <div className={className}>
    <CircleLoader color="#13c2c2" />
  </div>
))`
  position: fixed;
  right: 1rem;
  top: 1rem;
  z-index: 20;
`;

export enum DynamicFormTypes {
  // --------------------------------------------------------------
  // Basic Types
  // --------------------------------------------------------------

  Checkbox = 'Checkbox',
  Button = 'Button',
  Hidden = 'Hidden',
  Plain = 'Plain',
  Input = 'Input',
  InputNumber = 'InputNumber',
  TextArea = 'TextArea',
  DateTime = 'DateTime',
  Date = 'Date',

  // --------------------------------------------------------------
  // Advanced Types
  // --------------------------------------------------------------

  Image = 'Image',
  Images = 'Images',
  File = 'File',
  Files = 'Files',
  Video = 'Video',
  Deletable = 'Deletable',
  Switch = 'Switch',
  Authorities = 'Authorities',
  Enum = 'Enum',
  EnumFilter = 'EnumFilter',
  SimpleJSON = 'SimpleJSON',
  SortPosition = 'SortPosition',
  RichImage = 'RichImage',
  RichText = 'RichText',
  Association = 'Association',
  ManyToMany = 'ManyToMany',
}

type DynamicFormProps = {
  loading?: boolean;
  anchor?: boolean;
  /**
   * 隐藏提交按钮
   */
  delegate?: boolean;
  fields: FormField[];
  onSubmit: (fn: (e: Error) => void) => void;
};

type DynamicFormField = {
  foreignOpts: Asuna.Schema.ForeignOpt[];
  options: MetaInfoOptions & {
    tooltip: string;
  };
  ref: string;
  key: string;
  name: string;
  type: DynamicFormTypes;
  raw: any[];
  value: any | any[];
};

/**
 * delegate: hide submit button, using ref: form.
 * fields: {
 *   [name]: {
 *     name,
 *     type   : DynamicFormTypes.Input,
 *     options: { required: true },
 *   },
 * }
 */
export class DynamicForm extends React.Component<
  DynamicFormProps & AntdFormOnChangeListener & FormComponentProps
> {
  _buildField = (fields: FormField[], field: DynamicFormField, index: number) => {
    const { form } = this.props;

    const options: DeepPartial<
      DynamicFormField['options'] &
        HiddenOptions &
        PlainOptions &
        InputOptions &
        SelectOptions &
        StringArrayOptions
    > = {
      ...field.options,
      // key: field.key || field.name,
      name: field.name,
      help: field.options.tooltip || field.options.help,
    };
    const defaultAssociation = {
      name: 'name',
      value: 'id',
      fields: ['id', 'name'],
    };

    logger.log('[DynamicForm]', '[buildField]', { field, index, options });

    // all readonly or hidden field will rendered as plain component
    if (_.includes(['readonly'], idx(field, _ => _.options.accessible))) {
      if (field.type === DynamicFormTypes.Images) {
        return (
          <PlainImages
            options={{
              text: _.defaultTo(field.value, options.defaultValue),
              ...(options as PlainOptions),
            }}
          />
        );
      }
      return generatePlain({
        text: _.defaultTo(field.value, options.defaultValue),
        ...options,
      } as PlainOptions);
    }
    if (_.includes(['hidden'], idx(field, _ => _.options.accessible))) {
      // return generatePlain({ text: <i>hidden</i>, ...(options as PlainOptions) });
      return null;
    }

    switch (field.type) {
      case DynamicFormTypes.Plain:
        return generatePlain({ text: field.value, ...options } as PlainOptions);
      case DynamicFormTypes.Input:
        return generateInput(form, options as InputOptions);
      case DynamicFormTypes.Checkbox:
        return generateCheckbox(form, options);
      case DynamicFormTypes.Hidden:
        return generateHidden(form, options as HiddenOptions);
      case DynamicFormTypes.InputNumber:
        return generateInputNumber(form, options);
      case DynamicFormTypes.TextArea:
        return generateTextArea(form, options);
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
        if (R.has('foreignOpts')(field)) {
          const { modelName, association = defaultAssociation, onSearch } = field.foreignOpts[0];

          const items = R.path(['associations', modelName, 'items'])(field);
          const existItems = R.path(['associations', modelName, 'existItems'])(field);
          const type = idx(field.options as EnumFilterMetaInfoOptions, _ => _.filterType);
          return generateSelect(form, {
            ...(options as any),
            items,
            existItems,
            mode: 'multiple',
            withSortTree: type === 'Sort',
            onSearch,
            getName: R.prop(association.name || defaultAssociation.name),
            getValue: R.prop(association.value || defaultAssociation.value),
          });
        }
        logger.warn('[buildField]', 'foreignOpts is required in association.', { field });
        return <div>association({util.inspect(field)}) need foreignOpts.</div>;
      }
      case DynamicFormTypes.Enum:
      //   // --------------------------------------------------------------
      //   // Enum / RelationShip
      //   // --------------------------------------------------------------
      //   logger.debug('[DynamicForm]', '[buildField][Enum]', field);
      //   const items = R.path(['options', 'enumData'])(field);
      //   return generateSelect(form, {
      //     ...options,
      //     items,
      //     getName: R.prop('key'),
      //   } as SelectOptions);
      // }
      case DynamicFormTypes.EnumFilter: {
        // --------------------------------------------------------------
        // EnumFilter|Enum / RelationShip
        // --------------------------------------------------------------
        logger.log('[DynamicForm]', '[buildField][EnumFilter|Enum]', { field });
        const enumData = idx(field.options as EnumFilterMetaInfoOptions, _ => _.enumData) || {};
        const items: Item[] = _.map(enumData, (value, key) => ({ key, value: [key, value] }));
        const type = idx(field.options as EnumFilterMetaInfoOptions, _ => _.filterType);
        logger.log('[DynamicForm]', '[buildField][EnumFilter|Enum]', { type, items });
        return generateSelect(form, { ...(options as any), items, getName: R.prop('key') });
      }
      case DynamicFormTypes.Association: {
        // --------------------------------------------------------------
        // OneToMany / OneToOne RelationShip
        // --------------------------------------------------------------
        logger.debug('[DynamicForm]', '[buildField][Association]', field);
        if (R.has('foreignOpts')(field)) {
          const { modelName, association = defaultAssociation, onSearch } = R.path([
            'foreignOpts',
            0,
          ])(field);

          const items = R.path(['associations', modelName, 'items'])(field);
          const existItems = R.path(['associations', modelName, 'existItems'])(field);
          return generateSelect(form, {
            ...(options as any),
            items,
            existItems,
            onSearch,
            getName: R.prop(association.name || defaultAssociation.name),
            getValue: R.prop(association.value || defaultAssociation.value),
          });
        }
        logger.warn('[DynamicForm]', '[buildField]', 'foreignOpts is required in association.', {
          field,
        });
        return <div>association({util.inspect(field)}) need foreignOpts.</div>;
      }
      case DynamicFormTypes.SimpleJSON: // TODO json-type is string-array
        logger.debug('[DynamicForm]', '[buildField][SimpleJSON]', field, options);
        return generateStringArray(form, { ...(options as any), items: field.value });
      default: {
        return (
          <WithDebugInfo key={index} info={field}>
            {`DynamicForm ${util.inspect({
              name: field.name,
              type: field.type,
              metaType: options.type,
              key: options.key,
            })} not implemented. :P`}
          </WithDebugInfo>
        );
      }
    }
  };

  _handleOnSubmit = e => {
    e.preventDefault();

    const { form, onSubmit } = this.props;
    form.validateFields((err, values) => {
      logger.log('[DynamicForm][handleOnSubmit]', values);
      if (err) {
        logger.error('[DynamicForm][handleOnSubmit]', 'error occurred in form', values, err);
      } else {
        onSubmit(e);
      }
    });
  };

  render() {
    const { loading, fields, delegate, anchor } = this.props;
    logger.log('[DynamicForm]', '[render]', { props: this.props });

    // validateFields((errors, values) => console.log({ errors, values }));
    // remove fields which type is not included
    // pure component will not trigger error handler

    const typedFields = _.filter(fields, field => _.has(field, 'type'));
    const renderFields = _.map(typedFields, (field, index) => (
      <EnhancedPureElement
        key={index}
        field={field}
        index={index}
        builder={_.curry(this._buildField)(fields)}
      />
    ));

    return (
      <React.Fragment>
        <div className="dynamic-form">
          {loading && <FixedLoading />}
          <Row type="flex" gutter={anchor ? 16 : 0}>
            <Col span={anchor ? 18 : 24}>
              <Form>
                {/* {_.map(fieldGroups, this.buildFieldGroup)} */}
                {/* {_.map(fields, this.buildField)} */}
                {renderFields}
                {!delegate && (
                  <Form.Item>
                    <Affix offsetBottom={20}>
                      <Button
                        type="primary"
                        htmlType="submit"
                        onClick={this._handleOnSubmit}
                        // disabled={hasErrors(getFieldsError())}
                      >
                        Submit
                      </Button>
                    </Affix>
                  </Form.Item>
                )}
              </Form>
            </Col>
            <Col span={anchor ? 6 : 0}>
              <FormAnchor fields={fields} />
            </Col>
          </Row>
        </div>
        {/* language=CSS */}
        <style jsx global>{`
          .dynamic-form .ant-form-item {
            margin-bottom: 0;
          }
        `}</style>
      </React.Fragment>
    );
  }
}

interface IFormAnchorProps {
  fields: FormField[];
}

class FormAnchor extends React.Component<IFormAnchorProps> {
  static propTypes = {
    fields: PropTypes.shape({}),
  };

  shouldComponentUpdate(nextProps, nextState) {
    const propsDiff = diff(this.props, nextProps);
    const stateDiff = diff(this.state, nextState);
    return propsDiff.isDifferent || stateDiff.isDifferent;
  }

  render() {
    const { fields } = this.props;
    const renderFields = R.compose(
      R.values(),
      R.omit(['id']),
      R.map(field => {
        logger.log('[anchor]', field);
        const noValue = R.isNil(field.value) || R.isEmpty(field.value) || false;
        // 目前使用的 RichText 在点击时会自动设置 value 为 '<p></p>'
        // (field.type === DynamicFormTypes.RichText) && field.value === '<p></p>'
        const fieldName = field.options.label || field.options.name || field.name;
        const requiredColor = field.options.required ? 'red' : '';
        const color = noValue ? requiredColor : 'green';
        const title = (
          <div>
            {field.options.required && <span style={{ color: 'red' }}>* </span>}
            <Tag color={color}>{fieldName}</Tag>
          </div>
        );
        return <Anchor.Link key={field.name} title={title} href={`#dynamic-form-${field.name}`} />;
      }),
      R.filter(field => field.type),
      R.filter(field => idx(field as DynamicFormField, _ => _.options.accessible) !== 'hidden'),
    )(fields);

    if (R.anyPass([R.isNil, R.isEmpty])(fields)) {
      return '';
    }

    return <Anchor>{renderFields}</Anchor>;
  }
}

interface IPureElementProps {
  field: DynamicFormField | FormField;
  index: number;
  builder: (field: DynamicFormField, index: number) => any;
}

const pureLogger = createLogger('components:dynamic-form:pure-element');

class EnhancedPureElement extends React.Component<IPureElementProps> {
  shouldComponentUpdate(nextProps, nextState) {
    pureLogger.log('[EnhancedPureElement][shouldComponentUpdate]', nextProps.field, nextState);
    const isRequired = R.path(['options', 'required'])(nextProps.field);
    const propsDiff = diff(this.props, nextProps, { exclude: ['builder'] });
    const stateDiff = diff(this.state, nextState);
    const shouldUpdate = isRequired || propsDiff.isDifferent || stateDiff.isDifferent;
    pureLogger.log(
      '[EnhancedPureElement][shouldComponentUpdate]',
      { isRequired },
      propsDiff,
      stateDiff,
    );
    if (shouldUpdate) {
      pureLogger.debug(
        '[EnhancedPureElement][shouldComponentUpdate]',
        {
          nextProps,
          nextState,
          propsDiff,
          stateDiff,
          isRequired,
          props: this.props,
          state: this.state,
        },
        shouldUpdate,
      );
    }
    pureLogger.log(
      '[EnhancedPureElement][shouldComponentUpdate]',
      { stateDiff, propsDiff, isRequired },
      shouldUpdate,
    );
    return shouldUpdate;
  }

  componentWillUnmount(): void {
    pureLogger.log('[EnhancedPureElement][componentWillUnmount]', this.state, this.props);
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    pureLogger.log('[EnhancedPureElement][componentDidCatch]', error, errorInfo);
  }

  componentDidMount(): void {
    pureLogger.log('[EnhancedPureElement][componentDidMount]', this.state, this.props);
  }

  render() {
    const { field, index, builder } = this.props;
    pureLogger.log('[EnhancedPureElement][render]', { props: this.props, state: this.state });

    // options.accessible = 'hidden' 时需要隐藏该元素
    const hidden = idx(field as DynamicFormField, _ => _.options.accessible) === 'hidden';

    if (hidden) {
      return null;
    }

    return (
      <React.Fragment>
        <div key={index} id={`dynamic-form-${field.name}`}>
          <WithDebugInfo info={field}>{builder(field as DynamicFormField, index)}</WithDebugInfo>
          <hr />
        </div>
        {/* language=CSS */}
        <style jsx>{`
          div hr {
            border-style: none;
            border-top: 1px dashed #8c8b8b;
            border-bottom: 1px dashed #fff;
            /*box-shadow: #bfbfbf 0 0 1px;*/
          }
        `}</style>
      </React.Fragment>
    );
  }
}
