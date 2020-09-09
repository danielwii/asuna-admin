const path = require('path');
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { loadFilesSync } from '@graphql-tools/load-files';

module.exports = (root) => {
  const resolversArray = loadFilesSync(path.join(root || __dirname, '**/*.resolver.js'));
  return mergeResolvers(resolversArray);
};
