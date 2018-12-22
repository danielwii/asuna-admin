import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import * as R from 'ramda';
import idx from 'idx';

import { Anchor, Button, Col, Form, Row, Tag } from 'antd';
import { FormComponentProps } from 'antd/es/form';

import {
  generateAuthorities,
  generateCheckbox,
  generateDateTime,
  generateHidden,
  generateImage,
  generateImages,
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
import { generateSelect, SelectOptions } from './elements/Select';

import { diff } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';
import { MetaInfoOptions } from 'typings/meta';

const logger = createLogger('components:dynamic-form', 'warn');

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
  Switch = 'Switch',
  Authorities = 'Authorities',
  Enum = 'Enum',
  EnumFilter = 'EnumFilter',

  // --------------------------------------------------------------
  // Advanced Types
  // --------------------------------------------------------------

  Image = 'Image',
  Images = 'Images',
  Video = 'Video',
  RichText = 'RichText',
  Association = 'Association',
  ManyToMany = 'ManyToMany',
}

type DynamicFormProps = {
  anchor?: boolean;
  /**
   * 隐藏提交按钮
   */
  delegate?: boolean;
  fields: FormField[];
  onSubmit: (fn: (e: Error) => void) => void;
};

type DynamicFormField = {
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
  _buildField = (field: DynamicFormField, index: number) => {
    const { form } = this.props;

    const options: DeepPartial<
      DynamicFormField['options'] & HiddenOptions & PlainOptions & InputOptions & SelectOptions
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
    if (_.includes(['readonly', 'hidden'], idx(field, _ => _.options.accessible))) {
      return generatePlain({ text: field.value, ...options } as PlainOptions);
    }
    if (_.includes(['hide-value'], idx(field, _ => _.options.accessible))) {
      return generatePlain(options as PlainOptions);
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
      case DynamicFormTypes.Image:
        return generateImage(form, options);
      case DynamicFormTypes.Images:
        return generateImages(form, options);
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
          const { modelName, association = defaultAssociation, onChange, onSearch } = R.path([
            'foreignOpts',
            0,
          ])(field);

          const items = R.path(['associations', modelName, 'items'])(field);
          const existItems = R.path(['associations', modelName, 'existItems'])(field);
          const type = idx(field, _ => _.options.filterType);
          return generateSelect(form, {
            ...options,
            items,
            existItems,
            mode: 'multiple',
            withSortTree: type === 'Sort',
            onSearch,
            onChange,
            getName: R.prop(association.name || defaultAssociation.name),
            getValue: R.prop(association.value || defaultAssociation.value),
          } as SelectOptions);
        }
        logger.warn('[buildField]', 'foreignOpts is required in association.', { field });
        return <div>association need foreignOpts.</div>;
      }
      case DynamicFormTypes.Enum:
      case DynamicFormTypes.EnumFilter: {
        // --------------------------------------------------------------
        // EnumFilter|Enum / RelationShip
        // --------------------------------------------------------------
        logger.log('[DynamicForm]', '[buildField][EnumFilter|Enum]', { field });
        const items = R.path(['options', 'enumData'])(field);
        const type = idx(field, _ => _.options.filterType);
        logger.log('[DynamicForm]', '[buildField][EnumFilter|Enum]', { type, items });
        return generateSelect(form, {
          ...options,
          items,
          getName: R.prop('key'),
        } as SelectOptions);
      }
      // case DynamicFormTypes.Enum: {
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
      case DynamicFormTypes.Association: {
        // --------------------------------------------------------------
        // OneToMany / OneToOne RelationShip
        // --------------------------------------------------------------
        logger.debug('[DynamicForm]', '[buildField][Association]', field);
        if (R.has('foreignOpts')(field)) {
          const { modelName, association = defaultAssociation, onChange, onSearch } = R.path([
            'foreignOpts',
            0,
          ])(field);

          const items = R.path(['associations', modelName, 'items'])(field);
          const existItems = R.path(['associations', modelName, 'existItems'])(field);
          return generateSelect(form, {
            ...options,
            items,
            existItems,
            onChange,
            onSearch,
            getName: R.prop(association.name || defaultAssociation.name),
            getValue: R.prop(association.value || defaultAssociation.value),
          } as SelectOptions);
        }
        logger.warn('[DynamicForm]', '[buildField]', 'foreignOpts is required in association.', {
          field,
        });
        return <div>association need foreignOpts.</div>;
      }
      default: {
        return (
          <div key={index}>
            DynamicForm `{field.type}-{options.type}-{options.key}` not implemented :P.
            <pre>{JSON.stringify(field)}</pre>
          </div>
        );
      }
    }
  };

  _handleOnSubmit = e => {
    logger.debug('[DynamicForm]', '[handleOnSubmit]', 'onSubmit', e);
    e.preventDefault();

    const { form, onSubmit } = this.props;
    form.validateFields((err, values) => {
      if (err) {
        logger.error('[DynamicForm]', '[handleOnSubmit]', 'error occurred in form', values, err);
      } else {
        onSubmit(e);
      }
    });
  };

  render() {
    const { fields, delegate, anchor } = this.props;
    logger.log('[DynamicForm]', '[render]', { props: this.props });

    // remove fields which type is not included
    // pure component will not trigger error handler

    const renderFields = _.map(_.filter(fields, field => _.has(field, 'type')), (field, index) => (
      <EnhancedPureElement key={index} field={field} index={index} builder={this._buildField} />
    ));

    return (
      <React.Fragment>
        <div className="dynamic-form">
          <Row type="flex" gutter={anchor ? 16 : 0}>
            <Col span={anchor ? 18 : 24}>
              <Form>
                {/* {_.map(fieldGroups, this.buildFieldGroup)} */}
                {/* {_.map(fields, this.buildField)} */}
                {renderFields}
                {!delegate && (
                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      onClick={this._handleOnSubmit}
                      // disabled={hasErrors(getFieldsError())}
                    >
                      Submit
                    </Button>
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
        logger.log('[anchor]', { field });
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
      R.filter(
        R.compose(
          R.not,
          R.pathOr(false, ['options', 'hidden']),
        ),
      ),
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

class EnhancedPureElement extends React.Component<IPureElementProps> {
  shouldComponentUpdate(nextProps, nextState) {
    const isRequired = R.path(['options', 'required'])(nextProps.field);
    const propsDiff = diff(this.props, nextProps);
    const stateDiff = diff(this.state, nextState);
    const shouldUpdate = isRequired || propsDiff.isDifferent || stateDiff.isDifferent;
    if (shouldUpdate) {
      logger.debug(
        '[EnhancedPureElement]',
        '[shouldComponentUpdate]',
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
    return shouldUpdate;
  }

  render() {
    const { field, index, builder } = this.props;
    logger.debug('[EnhancedPureElement]', '[render]', { props: this.props, state: this.state });

    // options.hidden = true 时需要隐藏该元素
    const hidden = R.pathOr(false, ['options', 'hidden'])(field);
    return (
      <React.Fragment>
        <div key={index} id={`dynamic-form-${field.name}`} hidden={hidden}>
          {builder(field as DynamicFormField, index)}
          <hr />
        </div>
        {/* language=CSS */}
        <style jsx>{`
          div hr {
            border-style: none;
            border-bottom: 0.05rem solid #bfbfbf;
            box-shadow: #bfbfbf 0 0 0.3rem;
          }
        `}</style>
      </React.Fragment>
    );
  }
}
