import { adminProxyCaller } from '@asuna-admin/adapters';
import { DrawerButton } from '@asuna-admin/components';
import { DebugInfo, diff, parseString, useAsunaDrafts } from '@asuna-admin/helpers';
import { WithDebugInfo } from '@asuna-admin/helpers/debug';
import { createLogger } from '@asuna-admin/logger';
import { Asuna } from '@asuna-admin/types';
import { EnumFilterMetaInfoOptions, MetaInfoOptions } from '@asuna-admin/types/meta';
import { Paper } from '@material-ui/core';

import { Affix, Anchor, Button, Col, Divider, Form, List, Popconfirm, Row, Tag } from 'antd';
import { FormComponentProps } from 'antd/es/form';
import { WrappedFormUtils } from 'antd/es/form/Form';
import * as _ from 'lodash';
import * as fp from 'lodash/fp';
import moment from 'moment';
import * as PropTypes from 'prop-types';
import * as R from 'ramda';
import * as React from 'react';
import { useMemo } from 'react';
import { CircleLoader, ScaleLoader } from 'react-spinners';
import VisualDiff from 'react-visual-diff';
import styled from 'styled-components';
import * as util from 'util';

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

export type DynamicFormProps = {
  model: string;
  fields: any[] | FormField[];
  onSubmit: (fn: (e: Error) => void) => void;
  onClose: () => void;
  loading?: boolean;
  anchor?: boolean;
  /**
   * 隐藏提交按钮
   */
  delegate?: boolean;
  auditMode?: boolean;
  formRef?: (form: WrappedFormUtils) => void;
};

/*
{name: string;
    ref: string;
    type: string;
    value?: any;
    options: {
      name: string;
      type: DynamicFormTypes;
      label: string | null;
      length: number | null;
      required: boolean;
      selectable?: string;
      jsonType?: string;
    };}
 */
export type DynamicFormFieldOptions = Partial<MetaInfoOptions> & {
  required?: boolean;
  tooltip?: string;
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
export const DynamicForm: React.FC<DynamicFormProps & AntdFormOnChangeListener & FormComponentProps> = ({
  form,
  model,
  fields,
  onSubmit,
  onClose,
  loading,
  delegate,
  anchor,
  auditMode,
  formRef,
}) => {
  formRef?.(form);
  const memoizedFields = useMemo(() => fields, [1]);
  const { loading: loadingDrafts, drafts, retry } = useAsunaDrafts({ type: model, refId: _.get(fields, 'id.value') });
  const _buildField = (fields: FormField[], field: DynamicFormField, index: number) => {
    field.options = field.options || {};
    const options: DeepPartial<DynamicFormField['options'] &
      HiddenOptions &
      PlainOptions &
      InputOptions &
      SelectOptions &
      StringArrayOptions> = {
      ...field.options,
      // key: field.key || field.name,
      name: field.name,
      label: field.options.name || field.name,
      help: field.options.tooltip || field.options.help,
    };
    const defaultAssociation = {
      name: 'name',
      value: 'id',
      fields: ['id', 'name'],
    };

    logger.log('[DynamicForm]', '[buildField]', { field, index, options });

    // all readonly or hidden field will rendered as plain component
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
        if (field.foreignOpts) {
          const { modelName, association = defaultAssociation, onSearch } = field.foreignOpts[0];

          const items = R.path(['associations', modelName, 'items'])(field);
          const existItems = R.path(['associations', modelName, 'existItems'])(field);
          const type = (field.options as EnumFilterMetaInfoOptions)?.filterType;
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
        const enumData = (field.options as EnumFilterMetaInfoOptions)?.enumData || {};
        const items: Item[] = _.map(enumData, (value, key) => ({ key, value: [key, value] }));
        const type = (field.options as EnumFilterMetaInfoOptions)?.filterType;
        logger.log('[DynamicForm]', '[buildField][EnumFilter|Enum]', { type, items });
        return generateSelect(form, { ...(options as any), items, getName: R.prop('key') });
      }
      case DynamicFormTypes.Association: {
        // --------------------------------------------------------------
        // OneToMany / OneToOne RelationShip
        // --------------------------------------------------------------
        logger.debug('[DynamicForm]', '[buildField][Association]', field);
        if (R.has('foreignOpts')(field)) {
          const { modelName, association = defaultAssociation, onSearch } = R.path(['foreignOpts', 0])(field);

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

  const _handleOnAuditDraft = e => {
    e.preventDefault();

    form.validateFields(async (err, values) => {
      logger.log('[DynamicForm][handleOnAuditDraft]', values);
      if (err) {
        logger.error('[DynamicForm][handleOnAuditDraft]', 'error occurred in form', values, err);
      } else {
        const refId = _.get(fields, 'id.value');
        await adminProxyCaller().createDraft({ content: values, type: model, refId });
        if (!refId) {
          onClose();
        } else {
          retry();
        }
      }
    });
  };

  const _handleOnSubmit = e => {
    e.preventDefault();

    form.validateFields((err, values) => {
      logger.log('[DynamicForm][handleOnSubmit]', values);
      if (err) {
        logger.error('[DynamicForm][handleOnSubmit]', 'error occurred in form', values, err);
      } else {
        onSubmit(e);
      }
    });
  };

  logger.log('[DynamicForm]', '[render]');

  // validateFields((errors, values) => console.log({ errors, values }));
  // remove fields which type is not included
  // pure component will not trigger error handler

  const typedFields = _.filter(fields, field => _.has(field, 'type'));
  const renderFields = _.map(typedFields, (field, index) => (
    <EnhancedPureElement key={index} field={field} index={index} builder={_.curry(_buildField)(fields)} />
  ));

  return (
    <>
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
                    <Paper style={{ padding: '.5rem' }}>
                      <>
                        <Button
                          type="primary"
                          htmlType="submit"
                          onClick={_handleOnSubmit}
                          // disabled={hasErrors(getFieldsError())}
                          disabled={auditMode}
                        >
                          提交
                        </Button>
                        <Divider type="vertical" />
                        {(() => {
                          // const values = _.map(fields, fp.get('value'));
                          const values = _.flow(
                            fp.mapValues(fp.get('value')),
                            // fp.pick(_.keys(draft.content)),
                          )(fields);
                          const memoizedValues = _.flow(
                            fp.mapValues(fp.get('value')),
                            // fp.pick(_.keys(draft.content)),
                          )(memoizedFields);
                          return (
                            <DrawerButton
                              text="变更对比"
                              // key={draft.refId}
                              // text={`${moment(draft.updatedAt).calendar()}(${moment(draft.updatedAt).fromNow()})`}
                              // title={`Draft: ${draft.type} / ${draft.refId}`}
                              type="dashed"
                              width="60%"
                            >
                              <List<{ key: string; title: string; value: any }>
                                itemLayout="horizontal"
                                dataSource={_.map(values, (value, key) => {
                                  return {
                                    key,
                                    title:
                                      fields[key]?.options?.name ?? fields[key]?.options?.label ?? fields[key]?.name,
                                    value,
                                  };
                                })}
                                renderItem={item => (
                                  <List.Item>
                                    <List.Item.Meta
                                      title={item.title}
                                      description={
                                        <WithDebugInfo info={fields[item.key]}>
                                          <VisualDiff
                                            left={<div>{parseString(memoizedValues[item.key] ?? '')}</div>}
                                            right={<div>{parseString(item.value ?? '')}</div>}
                                          />
                                        </WithDebugInfo>
                                      }
                                    />
                                  </List.Item>
                                )}
                              />
                            </DrawerButton>
                          );
                        })()}
                      </>
                      <Divider type="vertical" />
                      {loadingDrafts ? (
                        <ScaleLoader />
                      ) : _.isEmpty(drafts) ? (
                        <Button onClick={_handleOnAuditDraft} disabled={!diff(fields, memoizedFields).isDifferent}>
                          提交待审核
                        </Button>
                      ) : (
                        <>
                          <Popconfirm onConfirm={_handleOnAuditDraft} title="重提交将覆盖已提交部分，确认重新提交？">
                            <Button>重提交</Button>
                          </Popconfirm>{' '}
                          待审核：
                          {drafts.map(draft => {
                            const values = _.flow(
                              fp.mapValues(fp.get('value')),
                              fp.pick(_.keys(draft.content)),
                            )(memoizedFields);
                            const filteredValues = _.omitBy(draft.content, (value, key) => _.eq(values[key], value));
                            return (
                              <DrawerButton
                                key={draft.refId}
                                text={`${moment(draft.updatedAt).calendar()}(${moment(draft.updatedAt).fromNow()})`}
                                title={`${draft.type} / ${draft.refId}`}
                                type="dashed"
                                width="40%"
                              >
                                <List<{ key: string; title: string; value: any }>
                                  itemLayout="horizontal"
                                  dataSource={_.map(draft.content, (value, key) => {
                                    return {
                                      key,
                                      title:
                                        fields[key]?.options?.name ?? fields[key]?.options?.label ?? fields[key]?.name,
                                      value,
                                    };
                                  })}
                                  renderItem={item => (
                                    <List.Item>
                                      <List.Item.Meta
                                        title={item.title}
                                        description={
                                          <WithDebugInfo info={fields[item.key]}>
                                            <VisualDiff
                                              left={<div>{parseString(values[item.key] ?? '')}</div>}
                                              right={<div>{parseString(item.value ?? '')}</div>}
                                            />
                                          </WithDebugInfo>
                                        }
                                      />
                                    </List.Item>
                                  )}
                                />
                              </DrawerButton>
                            );
                          })}
                        </>
                      )}
                    </Paper>
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
      <DebugInfo data={{ diff: diff(fields, memoizedFields) }} divider />
      {/* language=CSS */}
      <style jsx global>{`
        .dynamic-form .ant-form-item {
          margin-bottom: 0;
        }
      `}</style>
    </>
  );
};

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
      R.filter(field => (field as DynamicFormField)?.options?.accessible !== 'hidden'),
    )(fields);

    if (R.anyPass([R.isNil, R.isEmpty])(fields)) {
      return '';
    }

    return (
      <Anchor>
        <Paper style={{ margin: '.5rem' }}>{renderFields}</Paper>
      </Anchor>
    );
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
    pureLogger.log('[EnhancedPureElement][shouldComponentUpdate]', { isRequired }, propsDiff, stateDiff);
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
    pureLogger.log('[EnhancedPureElement][shouldComponentUpdate]', { stateDiff, propsDiff, isRequired }, shouldUpdate);
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
    const hidden = (field as DynamicFormField)?.options?.accessible === 'hidden';

    if (hidden) {
      return null;
    }

    return (
      <>
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
      </>
    );
  }
}
