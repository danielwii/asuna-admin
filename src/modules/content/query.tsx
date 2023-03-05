import { SyncOutlined } from '@ant-design/icons';
import { gql } from '@apollo/client';

import useLogger from '@danielwii/asuna-helper/dist/logger/hooks';

import { Button, Divider, Skeleton, Switch, Typography } from 'antd';
import * as _ from 'lodash';
import * as React from 'react';
import { useMemo } from 'react';
import useAsyncRetry from 'react-use/lib/useAsyncRetry';
import useInterval from 'react-use/lib/useInterval';
import useToggle from 'react-use/lib/useToggle';

import { AsunaDataViewHOC } from '../../components/AsunaDataView';
import { EasyForm } from '../../components/base/easy-form/form';
import { FormFieldType } from '../../components/base/easy-form/interfaces';
import { AppContext } from '../../core/context';
import { useAsunaModels } from '../../helpers/hooks';
import { extractModelNameFromPane, resolveModelInPane } from '../../helpers/models';
import { createLogger } from '../../logger';

import type { ModulesLoaderProps } from '..';

const logger = createLogger('content:query');

export type QueryFieldsColumnProps<EntitySchema> = (keyof EntitySchema)[];

const ContentSearch: React.FC<ModulesLoaderProps> = ({ basis }) => {
  const [autoRefresh, toggleAutoRefresh] = useToggle(false);
  useInterval(() => state.retry(), autoRefresh ? 5000 : null);
  const { modelName, extraName, modelConfig, primaryKey, columnOpts } = useMemo(() => {
    const extracted = extractModelNameFromPane(basis.pane);
    const resolved = resolveModelInPane(extracted.modelName, extracted.extraName);
    return { ...extracted, ...resolved };
  }, [basis.pane]);
  const [values, setValues] = React.useState<Record<string, any> | null>(null);

  const state = useAsyncRetry(async () => {
    if (!values) return null;
    const valuesByFields = _.mapValues(fields, (v, k) => {
      const v1 = _.get(values, k);
      const v2 = _.get(_.omit(values, k), k);
      return v1 ?? v2;
    });
    const hasFields = _.filter(valuesByFields, (value) => !(_.isUndefined(value) || _.isNull(value)));
    if (!_.isEmpty(hasFields)) {
      const keys = _.keys(fields);
      let record;
      if (keys.length === 1 && keys.includes(primaryKey)) {
        const loaded = await AppContext.ctx.models.fetch2(modelName, {
          id: valuesByFields[primaryKey],
          relations,
        });
        logger.info('record', loaded);
        // setViewRecord(record);
        record = loaded;
      } else {
        const data = await AppContext.ctx.models.loadModels2(modelName, { filters: valuesByFields, relations });
        // setViewRecord(_.head(data.items));
        record = _.head(data.items);
      }

      const { data, ...rest } = await AppContext.adapters.graphql.client.query({
        variables: { nName: `${modelName}.state`, nRefId: _.get(record, primaryKey), nRequest: { first: 1 } },
        query: gql`
          query loadActivities($nName: String!, $nRefId: String!, $nRequest: CursoredRequestInput!) {
            admin_cursored_activities(name: $nName, refId: $nRefId, request: $nRequest) {
              items {
                id
                createdAt
                from
                operation
                to
                reason
              }
            }
          }
        `,
        fetchPolicy: 'no-cache',
      });
      const activity = { data: _.get(data, 'admin_cursored_activities.items'), ...rest };

      return { record, activity };
    }
  }, [modelName, values]);

  const { relations } = useAsunaModels(modelName, {
    extraName,
    ctx: {
      onSearch: ({ searchText, searchedColumn }) => {
        logger.log('onSearch', { searchText, searchedColumn });
      },
    },
  });

  const fields = useMemo(
    () =>
      _.fromPairs(
        _.map(columnOpts?.columnProps?.queryFields || [primaryKey], (value) => [
          value,
          { name: value as string, type: FormFieldType.string },
        ]),
      ),
    [columnOpts],
  );

  /*{
    [primaryKey]: {
      name: primaryKey,
      type: FormFieldType.string,
      validate: value => null,
      // defaultValue: 'body.url',
      // help: '分享链接',
    },
  };*/

  useLogger('<[ContentSearch]>', { modelName, extraName, modelConfig, primaryKey, columnOpts, fields });

  return (
    <Typography style={{ margin: '1rem' }}>
      {/*<pre>{util.inspect(columnOpts?.columnProps?.queryFields)}</pre>*/}
      {/*<pre>{util.inspect(fields)}</pre>*/}

      {/*<Typography.Title level={3}>{pane.title}</Typography.Title>*/}
      <EasyForm
        initialValues={{}}
        fields={fields}
        onSubmit={setValues}
        // onClear={() => ComponentsHelper.clear({ key, collection }, refetch)}
      />

      <Divider type="horizontal" dashed style={{ margin: '0.5rem 0' }} />

      {values && (
        <div style={{ marginBottom: '1rem', textAlign: 'right' }}>
          <Switch
            checkedChildren={
              <>
                <SyncOutlined spin={autoRefresh} /> in 5s
              </>
            }
            unCheckedChildren={<span>自动刷新</span>}
            defaultChecked={autoRefresh}
            onClick={toggleAutoRefresh}
          />{' '}
          {!autoRefresh && (
            <Button size="small" type="primary" onClick={() => state.retry()} loading={state.loading}>
              刷新
            </Button>
          )}
        </div>
      )}

      {!state.value?.record && state.loading ? (
        <Skeleton active />
      ) : (
        <AsunaDataViewHOC
          modelName={modelName}
          extraName={extraName}
          data={state.value?.record}
          activity={_.get(state.value?.activity, 'data[0]') as any}
          onBack={() => setValues(null)}
        />
      )}

      {/*
      <Divider type="horizontal" dashed style={{ margin: '0.5rem 0' }} />

      <AsunaDataTable
        modelName={modelName}
        extraName={extraName}
        models={content.models}
        onView={(text, record) => setViewRecord(record)}
        rowClassName={columnOpts?.rowClassName}
      />*/}
    </Typography>
  );
};

export default ContentSearch;
