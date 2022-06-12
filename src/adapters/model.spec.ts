import preloadAll from 'jest-next-dynamic';
import { IModelService, ModelAdapterImpl } from './model';
import { DynamicFormTypes } from '../components/DynamicForm';
import { AppContext, AsunaDefinitions } from '../core/context';
import { storeConnector } from '../store';

beforeAll(async () => {
  await preloadAll();
});

describe('identify types', () => {
  const adapter = new ModelAdapterImpl({} as IModelService, new AsunaDefinitions());

  it('return right type', () => {
    expect(
      adapter.identifyType(null, {
        config: { type: 'DATETIME' },
        name: 'updated_at',
      }),
    ).toBe(DynamicFormTypes.Plain);

    expect(
      adapter.identifyType(null, {
        config: { type: 'DATETIME' },
        name: 'founded_at',
      }),
    ).toBe(DynamicFormTypes.DateTime);

    expect(
      adapter.identifyType(null, {
        config: { type: 'DATE' },
        name: 'founded_at',
      }),
    ).toBe(DynamicFormTypes.Date);

    expect(
      adapter.identifyType(null, {
        config: { type: 'DATE' },
        name: 'founded_at',
      }),
    ).toBe(DynamicFormTypes.Date);

    expect(
      adapter.identifyType(null, {
        config: {
          type: '', // TODO add selectable schema maybe?
          // foreignKeys: ['t_models.id'],
          info: {},
          many: true,
          selectable: 't_models',
        },
        name: 'models',
      }),
    ).toBe(DynamicFormTypes.ManyToMany);

    expect(
      adapter.identifyType(null, {
        config: {
          // foreignKeys: [],
          info: {
            enumData: [
              {
                key: 'model1s',
                value: 'model1s',
              },
              {
                key: 'model2s',
                value: 'model2s',
              },
            ],
            type: 'EnumFilter',
          },
          nullable: true,
          primaryKey: false,
          type: 'VARCHAR(8)',
        },
        name: 'type',
      }),
    ).toBe(DynamicFormTypes.EnumFilter);
  });
});

describe('getFormSchema', () => {
  it('should return settings and associations', () => {
    const definitions = new AsunaDefinitions();
    definitions.addModelOpts({ users: {} });
    definitions.addModelColumns({
      users: {
        associations: {
          roles: {
            fields: ['id', 'name'],
            name: 'name',
          },
        },
        settings: {
          password: {
            help: '新建用户后在列表页面设置密码',
            accessible: 'readonly',
          },
        },
      },
    });
    const adapter = new ModelAdapterImpl({} as IModelService, definitions);
    AppContext.regStore(storeConnector, { models: { schemas: { users: [{ name: 'password' }] } } }, true);
    const fields = adapter.getFormSchema('users', {});
    expect(fields).toEqual({
      password: {
        name: 'password',
        type: undefined,
        ref: 'password',
        options: {
          label: null,
          length: null,
          required: false,
          help: '新建用户后在列表页面设置密码',
          accessible: 'readonly',
          selectable: null,
        },
        value: undefined,
      },
    });
  });

  it('should return undefined when value not exists', () => {
    const adapter = new ModelAdapterImpl({} as IModelService, new AsunaDefinitions());
    AppContext.regStore(
      storeConnector,
      {
        models: { schemas: { test_schema: [{ name: 'test_name' }] } },
      },
      true,
    );
    const fields = adapter.getFormSchema('test_schema', { test_related_id: 1 });
    expect(fields).toEqual({
      test_name: {
        name: 'test_name',
        type: undefined,
        ref: 'test_name',
        options: { selectable: null, label: null, required: false, length: null },
        value: undefined,
      },
    });
  });

  it('should matched related fields', () => {
    const adapter = new ModelAdapterImpl({} as IModelService, new AsunaDefinitions());
    AppContext.regStore(
      storeConnector,
      {
        models: {
          schemas: {
            test_schema: [
              {
                config: {
                  info: {
                    name: 'TEST_NAME',
                    ref: 'test_related',
                    help: 'tooltip-info',
                  },
                  length: '50',
                  nullable: true,
                  primaryKey: false,
                  type: 'INTEGER',
                  selectable: 'other-relation',
                },
                name: 'test_related_id',
              },
            ],
          },
        },
      },
      true,
    );
    const fields = adapter.getFormSchema('test_schema', { test_related_id: 1 });
    expect(fields).toEqual({
      test_related: {
        name: 'test_related',
        options: {
          label: 'TEST_NAME',
          name: 'TEST_NAME',
          ref: 'test_related',
          required: false,
          length: 50,
          help: 'tooltip-info',
          selectable: 'other-relation',
        },
        ref: 'test_related',
        type: 'Association',
        value: 1,
      },
    });
  });

  it('should handle nullable fields', () => {
    const adapter = new ModelAdapterImpl({} as IModelService, new AsunaDefinitions());
    AppContext.regStore(
      storeConnector,
      {
        models: {
          schemas: {
            test_schema: [
              {
                config: {
                  // foreignKeys: [],
                  info: {},
                  length: '50',
                  nullable: true,
                  primaryKey: false,
                  type: 'INTEGER',
                },
                name: 'test-nullable',
              },
            ],
          },
        },
      },
      true,
    );
    const fieldsWithNullable = adapter.getFormSchema('test_schema', { 'test-nullable': 1 });

    expect(fieldsWithNullable).toEqual({
      'test-nullable': {
        name: 'test-nullable',
        options: {
          selectable: null,
          required: false,
          length: 50,
          label: null,
        },
        ref: 'test-nullable',
        type: 'InputNumber',
        value: 1,
      },
    });

    AppContext.regStore(
      storeConnector,
      {
        models: {
          schemas: {
            test_schema: [
              {
                config: {
                  // foreignKeys: [],
                  info: {},
                  length: '50',
                  nullable: false,
                  primaryKey: false,
                  type: 'INTEGER',
                },
                name: 'test-nullable',
              },
            ],
          },
        },
      },
      true,
    );
    const fieldsWithRequired = adapter.getFormSchema('test_schema', { 'test-nullable': 1 });

    expect(fieldsWithRequired).toEqual({
      'test-nullable': {
        name: 'test-nullable',
        options: {
          selectable: null,
          required: true,
          label: null,
          length: 50,
        },
        ref: 'test-nullable',
        type: 'InputNumber',
        value: 1,
      },
    });

    AppContext.regStore(
      storeConnector,
      {
        models: {
          schemas: {
            test_schema: [
              {
                config: {
                  // foreignKeys: [],
                  info: {},
                  length: '',
                  nullable: false,
                  primaryKey: false,
                  type: 'INTEGER',
                },
                name: 'test-nullable',
              },
            ],
          },
        },
      },
      true,
    );
    const fieldsWithNoLength = adapter.getFormSchema('test_schema', { 'test-nullable': 1 });

    expect(fieldsWithNoLength).toEqual({
      'test-nullable': {
        name: 'test-nullable',
        options: {
          selectable: null,
          required: true,
          label: null,
          length: null,
        },
        ref: 'test-nullable',
        type: 'InputNumber',
        value: 1,
      },
    });

    AppContext.regStore(
      storeConnector,
      {
        models: {
          schemas: {
            test_schema: [
              {
                config: {
                  // foreignKeys: [],
                  info: {
                    required: true,
                  },
                  length: '50',
                  nullable: true,
                  primaryKey: false,
                  type: 'INTEGER',
                },
                name: 'test-nullable',
              },
            ],
          },
        },
      },
      true,
    );
    const fieldsWithRequiredInInfo = adapter.getFormSchema('test_schema', { 'test-nullable': 1 });

    expect(fieldsWithRequiredInInfo).toEqual({
      'test-nullable': {
        name: 'test-nullable',
        options: {
          selectable: null,
          required: true,
          label: null,
          length: 50,
        },
        ref: 'test-nullable',
        type: 'InputNumber',
        value: 1,
      },
    });

    AppContext.regStore(
      storeConnector,
      {
        models: {
          schemas: {
            test_schema: [
              {
                config: {
                  // foreignKeys: [],
                  info: {
                    required: true,
                  },
                  length: '50',
                  nullable: false,
                  primaryKey: false,
                  type: 'INTEGER',
                },
                name: 'test-nullable',
              },
            ],
          },
        },
      },
      true,
    );
    const fieldsWithRequiredInInfoConflict = adapter.getFormSchema('test_schema', {
      'test-nullable': 1,
    });

    expect(fieldsWithRequiredInInfoConflict).toEqual({
      'test-nullable': {
        name: 'test-nullable',
        options: {
          selectable: null,
          required: true,
          length: 50,
          label: null,
        },
        ref: 'test-nullable',
        type: 'InputNumber',
        value: 1,
      },
    });
  });
});
