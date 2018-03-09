import { ModelsAdapter } from './models';

// test('adds 1 + 2 to equal 3', () => {
//   let result    = {};
//   const service = {
//     update: (...args) => { result = args; },
//   };
//   const adapter = new ModelsAdapter(service);
//
//   adapter.upsert({}, 'test-name', { body: { id: 1, related: 1 } });
//   expect(result).toBe(3);
// });

test('getFormFields matched related fields', () => {
  const adapter = new ModelsAdapter({});
  const fields  = adapter.getFormSchema({
    test_schema: [
      {
        config: {
          foreign_keys: [
            't_test_relates.id',
          ],
          info        : {
            name: 'TEST_NAME',
            ref : 'test_related',
          },
          nullable    : true,
          primary_key : false,
          type        : 'INTEGER',
        },
        name  : 'test_related_id',
      },
    ],
  }, 'test_schema', { test_related_id: 1 });
  expect(fields).toEqual({
    test_related: {
      name  : 'test_related',
      options: {
        foreignKeys: [
          't_test_relates.id',
        ],
        label: 'TEST_NAME',
        name: 'TEST_NAME',
        ref: 'test_related',
      },
      ref: 'test_related',
      type: 'Association',
      value: 1,
    },
  });
});
