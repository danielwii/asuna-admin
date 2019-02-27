import ApolloClient from 'apollo-boost';
import gql from 'graphql-tag';
import { createLogger } from '@asuna-admin/logger';

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

export interface IGraphQLService {
  client: ApolloClient<any>;
  query(queryString: string): Promise<any>;
  queryT(query: string): Promise<any>;
}

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

const logger = createLogger('adapters:graphql');

export class GraphqlAdapter {
  public client;
  constructor(uri?: string) {
    if (uri) {
      this.client = new ApolloClient({ uri });
    } else {
      logger.log('graphql uri not defined, using /graphql for default');
      this.client = new ApolloClient({ uri: '/graphql' });
    }
  }

  async query(queryString: string) {
    return this.client.query({
      query: gql`
        ${queryString}
      `,
    });
  }

  async queryT(query: string) {
    return this.client.query({ query });
  }
}
