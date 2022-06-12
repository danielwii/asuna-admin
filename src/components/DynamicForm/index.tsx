import { Paper } from '@material-ui/core';

import { Affix, Anchor, Button, Col, Divider, Form, FormInstance, List, Popconfirm, Row, Tag } from 'antd';
import consola from 'consola';
import * as _ from 'lodash';
import * as fp from 'lodash/fp';
import moment from 'moment';
import * as R from 'ramda';
import * as React from 'react';
import { useMemo } from 'react';
import { CircleLoader, ScaleLoader } from 'react-spinners';
import { useAsync, useSetState } from 'react-use';
import VisualDiff from 'react-visual-diff';
import styled from 'styled-components';

import { adminProxyCaller } from '../../adapters/admin';
import { DebugInfo, WithDebugInfo } from '../../helpers/debug';
import { useAsunaDrafts } from '../../helpers/hooks';
import { diff } from '../../helpers/utils';
import { createLogger } from '../../logger';
import { SchemaHelper } from '../../schema/helper';
import { parseAddressStr } from '../Address';
import { DrawerButton } from '../base/drawer-button/drawer-button';
import { parseString } from '../base/helper/helper';
import { DynamicFormField, RenderedField } from './render';
import { DynamicFormTypes } from './types';

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

export type DynamicFormProps = {
  model: string;
  fields: any[] | FormField[];
  onSubmit: (values: Record<string, any>) => Promise<any>;
  onClose: () => void;
  loading?: boolean;
  anchor?: boolean;
  /**
   * 隐藏提交按钮
   */
  delegate?: boolean;
  auditMode?: boolean;
  formRef?: (form: FormInstance) => void;
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

interface FieldDef {
  field;
  // 附加参数
  extra?;
  // 组件内部状态
  innerState?;
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
export const DynamicForm: React.FC<DynamicFormProps & AntdFormOnChangeListener> = ({
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
  const [form] = Form.useForm();
  formRef?.(form);
  const memoizedFields = useMemo(() => fields, [1]); // used to diff
  const { loading: loadingDrafts, drafts, retry } = useAsunaDrafts({ type: model, refId: _.get(fields, 'id.value') });
  const { value: schema } = useAsync(() => SchemaHelper.getSchema(model), [model]);
  const [state, setState] = useSetState<Record<string, FieldDef>>(
    _.assign({}, ..._.map(fields, (field) => ({ [field.name]: { field } }))),
  );
  const fieldsValue = _.mapValues(state, ({ field }) => field.value);
  React.useEffect(() => form.setFieldsValue(fieldsValue), []);

  const _handleOnAuditDraft = (e) => {
    e.preventDefault();

    form
      .validateFields()
      .then(async (values) => {
        logger.log('[DynamicForm][handleOnAuditDraft]', values);
        const refId = _.get(fields, 'id.value');
        await adminProxyCaller().createDraft({ content: values, type: model, refId });
        if (!refId) {
          onClose();
        } else {
          retry();
        }
      })
      .catch((reason) => {
        logger.error('[DynamicForm][handleOnAuditDraft]', 'error occurred in form', reason);
      });
  };

  const _handleOnSubmit = (e) => {
    e.preventDefault();

    form
      .validateFields()
      .then((values) => {
        logger.log('[DynamicForm][handleOnSubmit]', values);
        return onSubmit(values);
      })
      .catch((reason) => {
        logger.error('[DynamicForm][handleOnSubmit]', 'error occurred in form', reason);
      });
  };

  logger.log('[DynamicForm]', '[render]', fieldsValue);

  // validateFields((errors, values) => console.log({ errors, values }));
  // remove fields which type is not included
  // pure component will not trigger error handler

  const typedFields = _.filter(fields, (field) => _.has(field, 'type'));
  const renderFields = _.map(
    // 简单的排序方案
    _.sortBy(typedFields, (field) => {
      const pos = ['id'].indexOf(field.name) + 1;
      if (pos) return pos;
      if (field.name.startsWith('is')) return 10;
      return field.options.accessible === 'readonly' ? 20 : 30;
    }),
    (field) => (
      <EnhancedPureElement key={field.name} field={field}>
        <RenderedField model={model} schema={schema} form={form} fields={fields} field={field} />
      </EnhancedPureElement>
    ),
  );

  const renderedDrafts = loadingDrafts ? (
    <ScaleLoader />
  ) : _.isEmpty(drafts) ? (
    <Button onClick={_handleOnAuditDraft} /*disabled={!diff(fields, memoizedFields).isDifferent}*/>提交待审核</Button>
  ) : (
    <>
      <Popconfirm onConfirm={_handleOnAuditDraft} title="重提交将覆盖已提交部分，确认重新提交？">
        <Button>重提交</Button>
      </Popconfirm>{' '}
      待审核：
      {drafts.map((draft) => {
        const values = _.flow(fp.mapValues(fp.get('value')), fp.pick(_.keys(draft.content)))(memoizedFields);
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
                  title: fields[key]?.options?.name ?? fields[key]?.options?.label ?? fields[key]?.name,
                  value,
                };
              })}
              renderItem={(item) => (
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
  );
  return (
    <>
      <div className="dynamic-form">
        {loading && <FixedLoading />}
        <Row gutter={anchor ? 16 : 0}>
          <Col span={anchor ? 18 : 24}>
            <Form
              form={form}
              // onFinish={(values) => console.log('onFinish', values)}
              onFieldsChange={(values) => console.log('onFieldsChange', ...values)}
            >
              {/* {_.map(fieldGroups, this.buildFieldGroup)} */}
              {/* {_.map(fields, this.buildField)} */}
              {renderFields}
              {!delegate && (
                <Form.Item>
                  <Affix offsetBottom={20}>
                    <Paper style={{ padding: '.5rem' }}>
                      <>
                        {!auditMode && (
                          <>
                            <Button
                              type="primary"
                              htmlType="submit"
                              onClick={_handleOnSubmit}
                              size="small"
                              // disabled={hasErrors(getFieldsError())}
                              // disabled={auditMode}
                            >
                              提交
                            </Button>
                            <Divider type="vertical" />
                          </>
                        )}
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
                                renderItem={(item) => {
                                  const columnInfo = _.find(schema?.columns, (column) => column.name === item.key);

                                  const { before, after } = ((type) => {
                                    switch (type) {
                                      case DynamicFormTypes.Address:
                                        return {
                                          before: (
                                            <div>{parseAddressStr(parseString(memoizedValues[item.key] ?? ''))}</div>
                                          ),
                                          after: <div>{parseAddressStr(parseString(item.value ?? ''))}</div>,
                                        };
                                      default:
                                        return {
                                          before: <div>{parseString(memoizedValues[item.key] ?? '')}</div>,
                                          after: <div>{parseString(item.value ?? '')}</div>,
                                        };
                                    }
                                  })(columnInfo?.config?.info?.type);
                                  return (
                                    <List.Item>
                                      <List.Item.Meta
                                        title={item.title}
                                        description={
                                          <WithDebugInfo info={fields[item.key]}>
                                            <VisualDiff left={before} right={after} />
                                          </WithDebugInfo>
                                        }
                                      />
                                    </List.Item>
                                  );
                                }}
                              />
                            </DrawerButton>
                          );
                        })()}
                      </>
                      {auditMode && (
                        <>
                          <Divider type="vertical" />
                          {renderedDrafts}
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

const FormAnchor: React.VFC<IFormAnchorProps> = ({ fields }) => {
  if (R.anyPass([R.isNil, R.isEmpty])(fields)) {
    return null;
  }

  return (
    <Anchor>
      <Paper style={{ margin: '.5rem' }}>
        {R.compose(
          R.values,
          R.omit(['id']) as any,
          R.map<FormField & any, any>((field) => {
            logger.trace('[anchor]', field);
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
          R.filter<any>((field) => field.type),
          R.filter((field) => (field as DynamicFormField)?.options?.accessible !== 'hidden'),
        )(fields)}
      </Paper>
    </Anchor>
  );
};

interface IPureElementProps {
  field: DynamicFormField | FormField;
}

const pureLogger = consola.withScope('components:dynamic-form:pure-element');

const EnhancedPureElement: React.FC<IPureElementProps> = ({ field, children }) => {
  const hidden = (field as DynamicFormField)?.options?.accessible === 'hidden';

  pureLogger.log('[render]', field, { hidden });

  if (hidden) return null;

  return (
    <>
      <div key={field.name} id={`dynamic-form-${field.name}`}>
        <WithDebugInfo info={field}>{children}</WithDebugInfo>
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
};
