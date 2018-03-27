import * as schemaHelper from './schema';

describe('schemaHelper.enumDecorator', () => {
  test('schemaHelper.enumDecorator', async () => {
    const decorated = await schemaHelper.enumDecorator({
      refInclude   : { name: 'refInclude', value: [1] },
      refNotInclude: { name: 'refNotInclude' },
      type         :
        {
          name   : 'type',
          ref    : 'type',
          type   : 'EnumFilter',
          options: {
            filter_type: 'Sort',
            enum_data  : [
              { key: 'refInclude', value: 'refValue1' },
              { key: 'refNotInclude', value: 'refValue2' },
            ],
          },
          value  : 'refInclude',
        },
    });

    expect(decorated).toEqual({
      refInclude: {
        name         : 'refInclude',
        isFilterField: true,
        options      : { filter_type: 'Sort' },
        value        : [1],
      },
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
        raw    : [3, 1, 2],
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
});

describe('schemaHelper.jsonDecorator', () => {
  test('schemaHelper.jsonDecorator', async () => {
    const decorated = await schemaHelper.jsonDecorator({
      refInclude: { value: '[3, 2, 1]', type: 'ManyToMany', options: { json: 'str' } },
    });

    expect(decorated).toEqual({
      refInclude: { value: [3, 2, 1], type: 'ManyToMany', options: { json: 'str' } },
    });
  });

  test('schemaHelper.jsonDecorator empty string', async () => {
    const decorated = await schemaHelper.jsonDecorator({
      refInclude: { value: '', type: 'ManyToMany', options: { json: 'str' } },
    });

    expect(decorated).toEqual({
      refInclude: { value: null, type: 'ManyToMany', options: { json: 'str' } },
    });
  });

  test('schemaHelper.jsonDecorator return null for wrong json format', async () => {
    const decorated = await schemaHelper.jsonDecorator({
      refInclude: { value: 'test', type: 'ManyToMany', options: { json: 'str' } },
    });

    expect(decorated).toEqual({
      refInclude: { value: null, type: 'ManyToMany', options: { json: 'str' } },
    });
  });

  test('schemaHelper.jsonDecorator handle json format', async () => {
    const decorated = await schemaHelper.jsonDecorator({
      bg: {
        value  : [
          { bucket: 'images_uploader', filename: 'wallhaven-82908_thfrL3.jpg', mode: 'local', prefix: 'images/images_uploader' },
        ],
        type   : 'Image',
        options: { json: 'str' },
      },
    });

    expect(decorated).toEqual({
      bg: {
        value  : [
          { bucket: 'images_uploader', filename: 'wallhaven-82908_thfrL3.jpg', mode: 'local', prefix: 'images/images_uploader' },
        ],
        type   : 'Image',
        options: { json: 'str' },
      },
    });
  });
});


describe('schemaHelper.hiddenComponentDecorator', () => {
  it('should hidden id when value not exists', () => {
    const decorated = schemaHelper.hiddenComponentDecorator({
      id        : { value: null },
      created_at: { value: null },
      updated_at: { value: null },
    });

    expect(decorated).toEqual({
      id: { options: { hidden: true }, value: null },
    });
  });

  it('should not hidden id with value', () => {
    const decorated = schemaHelper.hiddenComponentDecorator({
      id        : { value: 1 },
      created_at: { value: null },
      updated_at: { value: null },
    });

    expect(decorated).toEqual({
      id: { value: 1, options: { hidden: false } },
    });
  });

  it('should hidden SortPosition', () => {
    const decorated = schemaHelper.hiddenComponentDecorator({
      positions: { options: { type: 'SortPosition' } },
    });

    expect(decorated).toEqual({
      positions: { options: { type: 'SortPosition', hidden: true } },
    });
  });

  it('should remove createdAt and updatedAt fields', () => {
    const decorated = schemaHelper.hiddenComponentDecorator({
      created_at: { value: null },
      updated_at: { value: null },
    });

    expect(decorated).toEqual({});
  });
});
