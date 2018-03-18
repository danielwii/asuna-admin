import { schemaHelper } from '.';

test('schemaHelper.enumDecorator', async () => {
  const decorated = await schemaHelper.enumDecorator({
    refInclude   : { name: 'refInclude' },
    refNotInclude: { name: 'refNotInclude' },
    type         :
      {
        name   : 'type',
        ref    : 'type',
        type   : 'EnumFilter',
        options: {
          filter_type: 'Sort',
          enum_data  : [{ key: 'refInclude', value: 'refValue1' }, {
            key  : 'refNotInclude',
            value: 'refValue2',
          }],
        },
        value  : 'refInclude',
      },
  });

  expect(decorated).toEqual({
    refInclude: { name: 'refInclude', isFilterField: true, options: { filter_type: 'Sort' } },
    type      :
      {
        name   : 'type',
        ref    : 'type',
        type   : 'EnumFilter',
        options: {
          filter_type: 'Sort',
          enum_data  : [{
            key: 'refInclude', value: 'refValue1',
          }, {
            key: 'refNotInclude', value: 'refValue2',
          }],
        },
        value  : 'refInclude',
      },
  });
});

test('schemaHelper.enumDecorator no type found', async () => {
  const decorated = await schemaHelper.enumDecorator({
    type: { value: 'refInclude' },
  });

  expect(decorated).toEqual({ type: { value: 'refInclude' } });
});

test('schemaHelper.enumDecorator SortPosition with no value', async () => {
  const decorated = await schemaHelper.enumDecorator({
    refInclude: { value: [1, 2, 3], type: 'ManyToMany' },
    type      : {
      type   : 'EnumFilter',
      value  : 'refInclude',
      options: {
        filter_type: 'Sort',
        enum_data  : [{
          key: 'refInclude', value: 'refValue1',
        }],
      },
    },
    positions : { options: { type: 'SortPosition' } },
  });

  expect(decorated).toEqual({
    refInclude: {
      type         : 'ManyToMany',
      isFilterField: true,
      options      : {
        filter_type: 'Sort',
      },
      value        : [1, 2, 3],
    },
    type      : {
      type   : 'EnumFilter',
      value  : 'refInclude',
      options: {
        filter_type: 'Sort',
        enum_data  : [{
          key: 'refInclude', value: 'refValue1',
        }],
      },
    },
    positions : { options: { type: 'SortPosition' }, value: [1, 2, 3] },
  });
});

test('schemaHelper.enumDecorator SortPosition with value', async () => {
  const decorated = await schemaHelper.enumDecorator({
    refInclude: { value: [1, 2, 3], type: 'ManyToMany' },
    type      : {
      type   : 'EnumFilter',
      value  : 'refInclude',
      options: {
        filter_type: 'Sort',
        enum_data  : [{
          key: 'refInclude', value: 'refValue1',
        }],
      },
    },
    positions : {
      options: { type: 'SortPosition' },
      value  : [3, 1, 2],
    },
  });

  expect(decorated).toEqual({
    refInclude: {
      type         : 'ManyToMany',
      isFilterField: true,
      options      : {
        filter_type: 'Sort',
      },
      value        : [3, 1, 2],
    },
    type      : {
      type   : 'EnumFilter',
      value  : 'refInclude',
      options: {
        filter_type: 'Sort',
        enum_data  : [{
          key: 'refInclude', value: 'refValue1',
        }],
      },
    },
    positions : {
      options: { type: 'SortPosition' },
      value  : [3, 1, 2],
      raw  : [3, 1, 2],
    },
  });
});

test('schemaHelper.enumDecorator SortPosition with str value', async () => {
  const decorated = await schemaHelper.enumDecorator({
    refInclude: { value: [1, 2, 3], type: 'ManyToMany' },
    type      : {
      type   : 'EnumFilter',
      value  : 'refInclude',
      options: {
        filter_type: 'Sort',
        enum_data  : [{
          key: 'refInclude', value: 'refValue1',
        }],
      },
    },
    positions : {
      options: { type: 'SortPosition', json: 'str' },
      value  : '[3, 1, 2]',
    },
  });

  expect(decorated).toEqual({
    refInclude: {
      type         : 'ManyToMany',
      isFilterField: true,
      options      : {
        filter_type: 'Sort',
      },
      value        : [3, 1, 2],
    },
    type      : {
      type   : 'EnumFilter',
      value  : 'refInclude',
      options: {
        filter_type: 'Sort',
        enum_data  : [{
          key: 'refInclude', value: 'refValue1',
        }],
      },
    },
    positions : {
      options: { type: 'SortPosition', json: 'str' },
      value  : [3, 1, 2],
      raw    : '[3, 1, 2]',
    },
  });
});

test('schemaHelper.enumDecorator SortPosition with value and already resolved', async () => {
  const decorated = await schemaHelper.enumDecorator({
    refInclude: { value: [3, 2, 1], type: 'ManyToMany' },
    type      : {
      type   : 'EnumFilter',
      value  : 'refInclude',
      options: {
        filter_type: 'Sort',
        enum_data  : [{
          key: 'refInclude', value: 'refValue1',
        }],
      },
    },
    positions : {
      options: { type: 'SortPosition', json: 'str' },
      value  : '[3, 1, 2]',
      raw    : '[3, 1, 2]',
    },
  });

  expect(decorated).toEqual({
    refInclude: {
      type         : 'ManyToMany',
      isFilterField: true,
      options      : {
        filter_type: 'Sort',
      },
      value        : [3, 2, 1],
    },
    type      : {
      type   : 'EnumFilter',
      value  : 'refInclude',
      options: {
        filter_type: 'Sort',
        enum_data  : [{
          key: 'refInclude', value: 'refValue1',
        }],
      },
    },
    positions : {
      options: { type: 'SortPosition', json: 'str' },
      value  : [3, 2, 1],
      raw    : '[3, 1, 2]',
    },
  });
});
