import { AppContext } from '@asuna-admin/core';
import { RelationColumnProps } from '@asuna-admin/helpers';
import { Button, Divider, Table } from 'antd';
import { PaginationConfig } from 'antd/es/table';
import { SorterResult, TableCurrentDataSource } from 'antd/lib/table';
import { gql } from 'apollo-boost';
import * as _ from 'lodash';
import * as fp from 'lodash/fp';
import * as React from 'react';
import { useState } from 'react';
import { ApolloProvider, Query } from 'react-apollo';
import * as util from 'util';

interface IGraphTableProps {
  modelName: string;
  columns?: RelationColumnProps[];
  pagination: PaginationConfig;
  filters?: Record<any, string[]>;
  sorter?: Partial<SorterResult<any>>;
  relations?: string[];
  creatable: boolean;
  create: () => void;
  onChange?: (
    pagination: PaginationConfig,
    filters: Record<any, string[]>,
    sorter: SorterResult<any>,
    extra: TableCurrentDataSource<any>,
  ) => void;
}

interface IGraphTableState {}

export function GraphTable(props: IGraphTableProps) {
  const { modelName, columns, pagination, creatable, create, onChange } = props;
  const [state, setState] = useState<IGraphTableState>({});

  const keys = _.map(columns, fp.get('key')).filter(key => !['action'].includes(`${key}`));
  const _renderTable = () => (
    <Query
      fetchPolicy={'no-cache'}
      query={gql`
        {
          sys_${modelName} {
            total
            page
            size
            items {
              ${keys}
            }
          }
        }
      `}
    >
      {({ loading, error, data, refetch }) => {
        if (error)
          return (
            <p>
              Error :( <pre>{util.inspect(error)}</pre>{' '}
            </p>
          );

        // const favoriteInfos = _.omit(data.favoriteInfos, '__typename');
        // const spanCount = Math.floor(24 / Object.keys(favoriteInfos).length);

        return (
          <div>
            {creatable && (
              <React.Fragment>
                <Button onClick={create}>Create</Button>
                <Divider type="vertical" />
              </React.Fragment>
            )}
            <Button onClick={() => refetch()}>刷新</Button>

            <hr />

            <pre>{util.inspect({ data, loading })}</pre>
            <Table
              className="asuna-content-table"
              dataSource={_.get(data, `sys_${modelName}.items`)}
              rowKey="id"
              loading={loading}
              columns={columns}
              pagination={pagination}
              onChange={onChange}
            />
          </div>
        );
      }}
    </Query>
  );

  return (
    <>
      <ApolloProvider client={AppContext.ctx.graphql.serverClient}>{_renderTable()}</ApolloProvider>
      <hr />
      <pre>{util.inspect(keys)}</pre>
      <pre>{util.inspect(props)}</pre>
    </>
  );
}
