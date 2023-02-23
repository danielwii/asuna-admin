/* eslint-disable @typescript-eslint/no-var-requires */
const { createConfigLoader } = require('node-buffs');
const axios = require('axios');
const fsExtra = require('fs-extra');
const _ = require('lodash');
const util = require('util');

const configLoader = createConfigLoader();
const url = `${configLoader.loadConfig('ENDPOINT') ?? ''}/graphql`;
axios
  .post(url, {
    // language=GraphQL
    query: `
      {
        sys_model_schemas {
          name
          schema
        }
      }
    `,
  })
  .then((response) => {
    const data = _.get(response.data, 'data.sys_model_schemas');
    const schemas = _.map(data, (current) => ({
      [current.name]: current.schema.map((v) => {
        console.log(v.name, v.config.type);
        return { [v.name]: '' };
      }),
    }));
    console.log(util.inspect(schemas, { color: true, depth: 5 }));
    fsExtra
      .writeJson('./schema.json', schemas)
      .then(() => {
        console.log('success!');
      })
      .catch((err) => {
        console.error(err);
      });
  });
