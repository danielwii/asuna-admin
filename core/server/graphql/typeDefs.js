const path = require('path');
const { fileLoader, mergeTypes } = require('merge-graphql-schemas');

module.exports = root => {
  const typesArray = fileLoader(path.join(root || __dirname, '**/*.graphql'));
  return mergeTypes(typesArray, { all: true });
};
