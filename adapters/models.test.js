import { ModelsAdapter }    from './models';
import { DynamicFormTypes } from '../components/DynamicForm';

test('identify types', () => {
  const adapter = new ModelsAdapter({});

  expect(adapter.identifyType({
    config: { type: 'DATETIME' },
    name  : 'updated_at',
  })).toBe(DynamicFormTypes.Plain);

  expect(adapter.identifyType({
    config: { type: 'DATETIME' },
    name  : 'founded_at',
  })).toBe(DynamicFormTypes.DateTime);

  expect(adapter.identifyType({
    config: { type: 'DATE' },
    name  : 'founded_at',
  })).toBe(DynamicFormTypes.Date);

  expect(adapter.identifyType({
    config: { type: 'DATE' },
    name  : 'founded_at',
  })).toBe(DynamicFormTypes.Date);

  expect(adapter.identifyType({
    config: {
      foreign_keys: ['t_models.id'],
      info        : {},
      many        : true,
      selectable  : 't_models',
    },
    name  : 'models',
  })).toBe(DynamicFormTypes.ManyToMany);

  expect(adapter.identifyType({
    config: {
      foreign_keys: [],
      info        : {
        enum_data: [
          {
            key  : 'model1s',
            value: 'model1s',
          },
          {
            key  : 'model2s',
            value: 'model2s',
          },
        ],
        type     : 'EnumFilter',
      },
      nullable    : true,
      primary_key : false,
      type        : 'VARCHAR(8)',
    },
    name  : 'type',
  })).toBe(DynamicFormTypes.EnumFilter);
});

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
            name   : 'TEST_NAME',
            ref    : 'test_related',
            tooltip: 'tooltip-info',
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
      name   : 'test_related',
      options: {
        foreignKeys: [
          't_test_relates.id',
        ],
        label      : 'TEST_NAME',
        name       : 'TEST_NAME',
        ref        : 'test_related',
        required   : false,
        tooltip    : 'tooltip-info',
      },
      ref    : 'test_related',
      type   : 'Association',
      value  : 1,
    },
  });
});
