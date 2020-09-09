const { ApolloServer } = require('apollo-server-koa');
const LRU = require('lru-cache');

const typeDefsLoader = require('./typeDefs');
const resolversLoader = require('./resolvers');

const cache = new LRU({
  max: 152,
  maxAge: 36e2,
});

module.exports = (app, { root, dev }) => {
  const apolloServer = new ApolloServer({
    typeDefs: typeDefsLoader(root),
    resolvers: resolversLoader(root),
    introspection: dev,
    playground: dev,
    tracing: dev,
    context: { cache },
    cacheControl: true,
  });
  apolloServer.applyMiddleware({ app });
  return apolloServer;
};
