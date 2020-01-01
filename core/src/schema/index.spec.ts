import preloadAll from 'jest-next-dynamic';
import { AppContext } from '../core';
import { storeConnector } from '../store/middlewares';
import * as schemaHelper from './';

beforeAll(async () => {
  await preloadAll();
});

describe('schemaHelper.enumDecorator', () => {
  test('schemaHelper.enumDecorator', async () => {
    const { fields: decorated } = await schemaHelper.enumDecorator({
      modelName: 'test-model',
      fields: {
        refInclude: { name: 'refInclude', value: [1] },
        refNotInclude: { name: 'refNotInclude' },
        type: {
          name: 'type',
          ref: 'type',
          type: 'EnumFilter',
          options: {
            filterType: 'Sort',
            enumData: {
              refInclude: 'refValue1',
              refNotInclude: 'refValue2',
            },
          },
          value: 'refInclude',
        },
      },
    });

    expect(decorated).toEqual({
      refInclude: {
        name: 'refInclude',
        isFilterField: true,
        options: { filterType: 'Sort' },
        value: [1],
      },
      type: {
        name: 'type',
        ref: 'type',
        type: 'EnumFilter',
        options: {
          filterType: 'Sort',
          enumData: {
            refInclude: 'refValue1',
            refNotInclude: 'refValue2',
          },
        },
        value: 'refInclude',
      },
    });
  });

  test('schemaHelper.enumDecorator no type found', async () => {
    const { fields: decorated } = await schemaHelper.enumDecorator({
      modelName: 'test-model',
      fields: {
        type: { value: 'refInclude' },
      },
    });

    expect(decorated).toEqual({ type: { value: 'refInclude' } });
  });

  test('schemaHelper.enumDecorator SortPosition with no value', async () => {
    const { fields: decorated } = await schemaHelper.enumDecorator({
      modelName: 'test-model',
      fields: {
        refInclude: { value: [1, 2, 3], type: 'ManyToMany' },
        type: {
          type: 'EnumFilter',
          value: 'refInclude',
          options: {
            filterType: 'Sort',
            enumData: {
              refInclude: 'refValue1',
            },
          },
        },
        positions: { options: { type: 'SortPosition' } },
      },
    });

    expect(decorated).toEqual({
      refInclude: {
        type: 'ManyToMany',
        isFilterField: true,
        options: {
          filterType: 'Sort',
        },
        value: [1, 2, 3],
      },
      type: {
        type: 'EnumFilter',
        value: 'refInclude',
        options: {
          filterType: 'Sort',
          enumData: {
            refInclude: 'refValue1',
          },
        },
      },
      positions: { options: { type: 'SortPosition' }, value: [1, 2, 3] },
    });
  });

  test('schemaHelper.enumDecorator SortPosition with value', async () => {
    const { fields: decorated } = await schemaHelper.enumDecorator({
      modelName: 'test-model',
      fields: {
        refInclude: { value: [1, 2, 3], type: 'ManyToMany' },
        type: {
          type: 'EnumFilter',
          value: 'refInclude',
          options: {
            filterType: 'Sort',
            enumData: {
              refInclude: 'refValue1',
            },
          },
        },
        positions: {
          options: { type: 'SortPosition' },
          value: [3, 1, 2],
        },
      },
    });

    expect(decorated).toEqual({
      refInclude: {
        type: 'ManyToMany',
        isFilterField: true,
        options: {
          filterType: 'Sort',
        },
        value: [3, 1, 2],
      },
      type: {
        type: 'EnumFilter',
        value: 'refInclude',
        options: {
          filterType: 'Sort',
          enumData: {
            refInclude: 'refValue1',
          },
        },
      },
      positions: {
        options: { type: 'SortPosition' },
        value: [3, 1, 2],
        raw: [3, 1, 2],
      },
    });
  });

  test('schemaHelper.enumDecorator SortPosition with str value', async () => {
    const { fields: decorated } = await schemaHelper.enumDecorator({
      modelName: 'test-model',
      fields: {
        refInclude: { value: [1, 2, 3], type: 'ManyToMany' },
        type: {
          type: 'EnumFilter',
          value: 'refInclude',
          options: {
            filterType: 'Sort',
            enumData: {
              refInclude: 'refValue1',
            },
          },
        },
        positions: {
          options: { type: 'SortPosition', json: 'str' },
          value: '[3, 1, 2]',
        },
      },
    });

    expect(decorated).toEqual({
      refInclude: {
        type: 'ManyToMany',
        isFilterField: true,
        options: {
          filterType: 'Sort',
        },
        value: [3, 1, 2],
      },
      type: {
        type: 'EnumFilter',
        value: 'refInclude',
        options: {
          filterType: 'Sort',
          enumData: {
            refInclude: 'refValue1',
          },
        },
      },
      positions: {
        options: { type: 'SortPosition', json: 'str' },
        value: [3, 1, 2],
        raw: '[3, 1, 2]',
      },
    });
  });

  test('schemaHelper.enumDecorator SortPosition with value and already resolved', async () => {
    const { fields: decorated } = await schemaHelper.enumDecorator({
      modelName: 'test-model',
      fields: {
        refInclude: { value: [3, 2, 1], type: 'ManyToMany' },
        type: {
          type: 'EnumFilter',
          value: 'refInclude',
          options: {
            filterType: 'Sort',
            enumData: {
              refInclude: 'refValue1',
            },
          },
        },
        positions: {
          options: { type: 'SortPosition', json: 'str' },
          value: '[3, 1, 2]',
          raw: '[3, 1, 2]',
        },
      },
    });

    expect(decorated).toEqual({
      refInclude: {
        type: 'ManyToMany',
        isFilterField: true,
        options: {
          filterType: 'Sort',
        },
        value: [3, 2, 1],
      },
      type: {
        type: 'EnumFilter',
        value: 'refInclude',
        options: {
          filterType: 'Sort',
          enumData: {
            refInclude: 'refValue1',
          },
        },
      },
      positions: {
        options: { type: 'SortPosition', json: 'str' },
        value: [3, 2, 1],
        raw: '[3, 1, 2]',
      },
    });
  });
});

describe('schemaHelper.jsonDecorator', () => {
  test('schemaHelper.jsonDecorator', async () => {
    const { fields: decorated } = await schemaHelper.jsonDecorator({
      modelName: 'test-model',
      fields: {
        refInclude: { value: '[3, 2, 1]', type: 'ManyToMany', options: { json: 'str' } },
      },
    });

    expect(decorated).toEqual({
      refInclude: { value: [3, 2, 1], type: 'ManyToMany', options: { json: 'str' } },
    });
  });

  test('schemaHelper.jsonDecorator empty string', async () => {
    const { fields: decorated } = await schemaHelper.jsonDecorator({
      modelName: 'test-model',
      fields: {
        refInclude: { value: '', type: 'ManyToMany', options: { json: 'str' } },
      },
    });

    expect(decorated).toEqual({
      refInclude: { value: null, type: 'ManyToMany', options: { json: 'str' } },
    });
  });

  test('schemaHelper.jsonDecorator return null for wrong json format', async () => {
    const { fields: decorated } = await schemaHelper.jsonDecorator({
      modelName: 'test-model',
      fields: {
        refInclude: { value: 'test', type: 'ManyToMany', options: { json: 'str' } },
      },
    });

    expect(decorated).toEqual({
      refInclude: { value: null, type: 'ManyToMany', options: { json: 'str' } },
    });
  });

  test('schemaHelper.jsonDecorator handle json format', async () => {
    const { fields: decorated } = await schemaHelper.jsonDecorator({
      modelName: 'test-model',
      fields: {
        bg: {
          value: [
            {
              bucket: 'images_uploader',
              filename: 'wallhaven-82908_thfrL3.jpg',
              mode: 'local',
              prefix: 'images/images_uploader',
            },
          ],
          type: 'Image',
          options: { json: 'str' },
        },
      },
    });

    expect(decorated).toEqual({
      bg: {
        value: [
          {
            bucket: 'images_uploader',
            filename: 'wallhaven-82908_thfrL3.jpg',
            mode: 'local',
            prefix: 'images/images_uploader',
          },
        ],
        type: 'Image',
        options: { json: 'str' },
      },
    });
  });
});

/*
describe('schemaHelper.hiddenComponentDecorator', () => {
  it('should hidden id when value not exists', () => {
    const { fields: decorated } = schemaHelper.hiddenComponentDecorator({
      modelName: 'test-model',
      fields: {
        id: { value: null },
        createdAt: { value: null },
        updatedAt: { value: null },
      },
    } as any);

    expect(decorated).toEqual({
      id: { options: { accessible: 'hidden' }, value: null },
    });
  });

  it('should not hidden id with value', () => {
    const { fields: decorated } = schemaHelper.hiddenComponentDecorator({
      modelName: 'test-model',
      fields: {
        id: { value: 1 },
        createdAt: { value: null },
        updatedAt: { value: null },
      },
    } as any);

    expect(decorated).toEqual({
      id: { value: 1, options: { accessible: 'hidden' } },
    });
  });

  it('should hidden SortPosition', () => {
    const { fields: decorated } = schemaHelper.hiddenComponentDecorator({
      modelName: 'test-model',
      fields: {
        positions: { options: { type: 'SortPosition' } },
      },
    } as any);

    expect(decorated).toEqual({
      positions: { options: { type: 'SortPosition', accessible: 'hidden' } },
    });
  });

  it('should remove createdAt and updatedAt fields', () => {
    const { fields: decorated } = schemaHelper.hiddenComponentDecorator({
      modelName: 'test-model',
      fields: {
        createdAt: { value: null },
        updatedAt: { value: null },
      },
    } as any);

    expect(decorated).toEqual({});
  });
});
*/
