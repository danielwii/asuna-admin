const path = require('path');
const { fileLoader, mergeResolvers } = require('merge-graphql-schemas');

module.exports = root => {
  const resolversArray = fileLoader(path.join(root || __dirname, '**/*.resolver.js'));
  return mergeResolvers(resolversArray);
};
