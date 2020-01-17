import { AppContext } from '@asuna-admin/core';
import { authHeader } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';

import ApolloClient, { gql } from 'apollo-boost';
import * as fp from 'lodash/fp';

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

/*
export interface IGraphQLService {
  client: ApolloClient<any>;
  serverClient: ApolloClient<any>;
  query(queryString: string): Promise<any>;
  queryT(query: string): Promise<any>;
  loadSchemas(): Promise<any>;
}
*/

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

const logger = createLogger('adapters:graphql');

export class GraphqlAdapterImpl {
  public client: ApolloClient<any>;
  public serverClient: ApolloClient<any>;
  constructor(uri?: string) {
    if (uri) {
      this.client = new ApolloClient({ uri });
    } else {
      logger.log('graphql uri not defined, using /graphql for default');
      this.client = new ApolloClient({ uri: '/graphql' });
    }
    this.serverClient = new ApolloClient({ uri: '/s-graphql', headers: authHeader().headers });
  }

  async query(queryString: string, client = this.client) {
    const promise = client.query({
      query: gql`
        ${queryString}
      `,
    });
    AppContext.syncSettings();
    return promise;
  }

  async queryT(query: any, client = this.client) {
    const promise = client.query({ query });
    AppContext.syncSettings();
    return promise;
  }

  async loadSchemas() {
    return this.serverClient
      .query({
        fetchPolicy: 'no-cache',
        query: gql`
          {
            sys_modelSchemas {
              name
              schema
            }
          }
        `,
      })
      .then(fp.get('data.sys_modelSchemas'));
  }

  async loadSystemSettings() {
    return this.serverClient
      .query({
        query: gql`
          {
            kvs(collection: "system.server") {
              key
              name
              type
              value
            }
          }
        `,
      })
      .then(fp.get('data.kvs'));
  }

  async loadKv(collection: string, key: string) {
    return this.serverClient
      .query({
        // fetchPolicy: 'cache-first',
        variables: { nCollection: collection, nKey: key },
        query: gql`
          query loadKv($nCollection: String, $nKey: String) {
            kv(collection: $nCollection, key: $nKey) {
              key
              name
              type
              value
            }
          }
        `,
      })
      .then(fp.get('data.kv'));
  }

  async loadGraphs() {
    return this.serverClient
      .query({
        query: gql`
          {
            __schema {
              queryType {
                fields {
                  name
                }
              }
            }
          }
        `,
      })
      .then(fp.get('data.__schema.queryType.fields'))
      .then(fp.map(fp.get('name')));
  }
}
