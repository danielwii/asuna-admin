import ApolloClient, { gql } from 'apollo-boost';
import * as fp from 'lodash/fp';
import { createLogger } from '@asuna-admin/logger';
import { AppContext } from '@asuna-admin/core';

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

export class GraphqlAdapter {
  public client: ApolloClient<any>;
  public serverClient: ApolloClient<any>;
  constructor(uri?: string) {
    if (uri) {
      this.client = new ApolloClient({ uri });
    } else {
      logger.log('graphql uri not defined, using /graphql for default');
      this.client = new ApolloClient({ uri: '/graphql' });
    }
    this.serverClient = new ApolloClient({ uri: '/s-graphql' });
  }

  async query(queryString: string) {
    const promise = this.client.query({
      query: gql`
        ${queryString}
      `,
    });
    AppContext.syncServerSettings();
    return promise;
  }

  async queryT(query: any) {
    const promise = this.client.query({ query });
    AppContext.syncServerSettings();
    return promise;
  }

  async loadSchemas() {
    return this.serverClient
      .query({
        query: gql`
          {
            sys_modelSchemas {
              name
              schema
            }
          }
        `,
        fetchPolicy: 'no-cache',
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
