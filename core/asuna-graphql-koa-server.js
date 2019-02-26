const { ApolloServer } = require('apollo-server-koa');

const typeDefsLoader = require('./server/graphql/typeDefs');
const resolversLoader = require('./server/graphql/resolvers');

module.exports = (app, { root }) => {
  const apolloServer = new ApolloServer({
    typeDefs: typeDefsLoader(root),
    resolvers: resolversLoader(root),
  });
  apolloServer.applyMiddleware({ app });
  return apolloServer;
};
