import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import * as R from 'ramda';
import { join } from 'path';

import { Anchor, Button, Col, Form, Row, Tag } from 'antd';

import { FormComponentProps } from 'antd/lib/form';

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
} from './elements';

import { generateSelect } from './elements/select';
import { diff } from '../../helpers';
import { config, ConfigKey } from '../../app/configure';
import { AuthState } from '../../store/auth.redux';
import { createLogger, lv } from '../../helpers/logger';

const logger = createLogger('components:dynamic-form', lv.warn);

export const DynamicFormTypes = {
  // --------------------------------------------------------------
  // Basic Types
  // --------------------------------------------------------------
  Checkbox: 'Checkbox',
  Button: 'Button',
  Hidden: 'Hidden',
  Plain: 'Plain',
  Input: 'Input',
  InputNumber: 'InputNumber',
  TextArea: 'TextArea',
  DateTime: 'DateTime',
  Date: 'Date',
  Switch: 'Switch',
  Authorities: 'Authorities',
  Enum: 'Enum',
  EnumFilter: 'EnumFilter',
  // --------------------------------------------------------------
  // Advanced Types
  // --------------------------------------------------------------
  Image: 'Image',
  Images: 'Images',
  Video: 'Video',
  RichText: 'RichText',
  Association: 'Association',
  ManyToMany: 'ManyToMany',
};

interface IProps {
  anchor: boolean;
  /**
   * 隐藏提交按钮
   */
  delegate?: boolean;
  fields: FormField[];
  auth: AuthState;
  onSubmit: (fn: (e: Error) => void) => void;
}

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
export class DynamicForm2 extends React.Component<IProps & IFormFix & FormComponentProps> {
  buildField = (field, index) => {
    const { form, auth } = this.props;

    const options = {
      ...field.options,
      key: field.key || field.name,
      name: field.name,
      help: field.options.tooltip || field.options.help,
      auth,
    };
    const defaultAssociation = {
      name: 'name',
      value: 'id',
      fields: ['id', 'name'],
    };

    logger.log('[DynamicForm2]', '[buildField]', { field, index, options });

    // all readonly or hidden field will rendered as plain component
    if (['readonly', 'hidden'].indexOf(_.get(field, 'options.accessible')) > -1) {
      return generatePlain({
        key: index,
        label: options.name,
        text: field.value,
        help: options.help,
      });
    } else if (['hide-value'].indexOf(_.get(field, 'options.accessible')) > -1) {
      return generatePlain({
        key: index,
        label: options.name,
        text: null,
        help: options.help,
      });
    }

    switch (field.type) {
      case DynamicFormTypes.Plain:
        return generatePlain({
          key: index,
          label: options.name,
          text: field.value,
          help: options.help,
        });
      case DynamicFormTypes.Input:
        return generateInput(form, options);
      case DynamicFormTypes.Checkbox:
        return generateCheckbox(form, options);
      case DynamicFormTypes.Hidden:
        return generateHidden(form, options);
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
        logger.info('[DynamicForm2]', '[buildField][ManyToMany]', { field });
        if (R.has('foreignOpts')(field)) {
          const { modelName, association = defaultAssociation } = R.path(['foreignOpts', 0])(field);

          const items = R.path(['associations', modelName, 'items'])(field);
          const type = R.path(['options', 'filterType'])(field);
          return generateSelect(form, {
            ...options,
            items,
            mode: 'multiple',
            withSortTree: type === 'Sort',
            getName: R.prop(association.name || defaultAssociation.name),
            getValue: R.prop(association.value || defaultAssociation.value),
          });
        }
        logger.warn('[buildField]', 'foreignOpts is required in association.', { field });
        return <div>association need foreignOpts.</div>;
      }
      case DynamicFormTypes.EnumFilter: {
        // --------------------------------------------------------------
        // EnumFilter / RelationShip
        // --------------------------------------------------------------
        logger.log('[DynamicForm2]', '[buildField][EnumFilter]', { field });
        const items = R.path(['options', 'enumData'])(field);
        const type = R.path(['options', 'filterType'])(field);
        logger.log('[DynamicForm2]', '[buildField][EnumFilter]', { type, items });
        return generateSelect(form, {
          ...options,
          items,
          getName: R.prop('key'),
        });
      }
      case DynamicFormTypes.Enum: {
        // --------------------------------------------------------------
        // Enum / RelationShip
        // --------------------------------------------------------------
        logger.info('[DynamicForm2]', '[buildField][Enum]', field);
        const items = R.path(['options', 'enumData'])(field);
        return generateSelect(form, {
          ...options,
          items,
          getName: R.prop('key'),
        });
      }
      case DynamicFormTypes.Association: {
        // --------------------------------------------------------------
        // OneToMany / OneToOne RelationShip
        // --------------------------------------------------------------
        logger.info('[DynamicForm2]', '[buildField][Association]', field);
        if (R.has('foreignOpts')(field)) {
          const { modelName, association = defaultAssociation } = R.path(['foreignOpts', 0])(field);

          const items = R.path(['associations', modelName, 'items'])(field);
          return generateSelect(form, {
            ...options,
            items,
            getName: R.prop(association.name || defaultAssociation.name),
            getValue: R.prop(association.value || defaultAssociation.value),
          });
        }
        logger.warn('[DynamicForm2]', '[buildField]', 'foreignOpts is required in association.', {
          field,
        });
        return <div>association need foreignOpts.</div>;
      }
      default:
        return (
          <div key={index}>
            DynamicForm2 `{field.type}-{options.type}-{options.key}` not implemented.
            <pre>{JSON.stringify(field)}</pre>
          </div>
        );
    }
  };

  handleOnSubmit = e => {
    logger.info('[DynamicForm2]', '[handleOnSubmit]', 'onSubmit', e);
    e.preventDefault();

    const { form, onSubmit } = this.props;
    form.validateFields((err, values) => {
      if (err) {
        logger.error('[DynamicForm2]', '[handleOnSubmit]', 'error occurred in form', values, err);
      } else {
        onSubmit(e);
      }
    });
  };

  render() {
    const { fields, delegate, anchor } = this.props;
    logger.log('[DynamicForm2]', '[render]', { props: this.props });

    // remove fields which type is not included
    // pure component will not trigger error handler

    const renderFields = _.map(_.filter(fields, field => !!field.type), (field, index) => (
      <EnhancedPureElement key={index} field={field} index={index} builder={this.buildField} />
    ));

    return (
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
                    onClick={this.handleOnSubmit}
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
        {/* language=CSS */}
        <style global jsx>{`
          .dynamic-form .ant-form-item {
            margin-bottom: 0;
          }
        `}</style>
      </div>
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
      R.filter(R.compose(R.not, R.pathOr(false, ['options', 'hidden']))),
    )(fields);

    if (R.anyPass([R.isNil, R.isEmpty])(fields)) {
      return '';
    }

    return <Anchor>{renderFields}</Anchor>;
  }
}

interface IPureElementProps {
  field: FormField;
  index: number;
  builder: (field: FormField, index: number) => any;
}

class EnhancedPureElement extends React.Component<IPureElementProps> {
  // static propTypes = {
  //   field  : PropTypes.shape({}),
  //   index  : PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  //   builder: PropTypes.func.isRequired,
  // };

  shouldComponentUpdate(nextProps, nextState) {
    const isRequired = R.path(['options', 'required'])(nextProps.field);
    const propsDiff = diff(this.props, nextProps);
    const stateDiff = diff(this.state, nextState);
    const shouldUpdate = isRequired || propsDiff.isDifferent || stateDiff.isDifferent;
    if (shouldUpdate) {
      logger.info(
        '[EnhancedPureElement]',
        '[shouldComponentUpdate]',
        {
          props: this.props,
          state: this.state,
          nextProps,
          nextState,
          propsDiff,
          stateDiff,
          isRequired,
        },
        shouldUpdate,
      );
    }
    return shouldUpdate;
  }

  render() {
    const { field, index, builder } = this.props;
    logger.info('[EnhancedPureElement]', '[render]', { props: this.props, state: this.state });

    // options.hidden = true 时需要隐藏该元素
    const hidden = R.pathOr(false, ['options', 'hidden'])(field);
    return (
      <div key={index} id={`dynamic-form-${field.name}`} hidden={hidden}>
        {builder(field, index)}
        <hr />
        {/* language=CSS */}
        <style jsx>{`
          hr {
            border-style: none;
            border-bottom: 0.05rem solid #bfbfbf;
            box-shadow: #bfbfbf 0 0 0.3rem;
          }
        `}</style>
      </div>
    );
  }
}
