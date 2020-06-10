const path = require('path');
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { loadFilesSync } from '@graphql-tools/load-files';

module.exports = root => {
  const typesArray = loadFilesSync(path.join(root || __dirname, '**/*.graphql'));
  return mergeTypeDefs(typesArray, { all: true });
};
