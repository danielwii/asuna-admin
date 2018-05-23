import { IModelService, ModelAdapter } from './model';
import { DynamicFormTypes } from '../components/DynamicForm/index';

describe('identify types', () => {
  const adapter = new ModelAdapter({} as IModelService);

  it('return right type', () => {
    expect(
      adapter.identifyType({
        config: { type: 'DATETIME' },
        name: 'updated_at',
      }),
    ).toBe(DynamicFormTypes.Plain);

    expect(
      adapter.identifyType({
        config: { type: 'DATETIME' },
        name: 'founded_at',
      }),
    ).toBe(DynamicFormTypes.DateTime);

    expect(
      adapter.identifyType({
        config: { type: 'DATE' },
        name: 'founded_at',
      }),
    ).toBe(DynamicFormTypes.Date);

    expect(
      adapter.identifyType({
        config: { type: 'DATE' },
        name: 'founded_at',
      }),
    ).toBe(DynamicFormTypes.Date);

    expect(
      adapter.identifyType({
        config: {
          // foreignKeys: ['t_models.id'],
          info: {},
          many: true,
          selectable: 't_models',
        },
        name: 'models',
      }),
    ).toBe(DynamicFormTypes.ManyToMany);

    expect(
      adapter.identifyType({
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
    const adapter = new ModelAdapter({} as IModelService, {
      tableColumns: {},
      modelColumns: {
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
      },
      models: {
        users: {},
      },
    });
    const fields = adapter.getFormSchema({ users: [{ name: 'password' }] } as any, 'users', {});
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
          selectable: undefined,
        },
        value: undefined,
      },
    });
  });

  it('should return undefined when value not exists', () => {
    const adapter = new ModelAdapter({} as IModelService);
    const fields = adapter.getFormSchema(
      {
        test_schema: [
          {
            name: 'test_name',
          },
        ],
      } as any,
      'test_schema',
      { test_related_id: 1 },
    );
    expect(fields).toEqual({
      test_name: {
        name: 'test_name',
        type: undefined,
        ref: 'test_name',
        options: { selectable: undefined, label: null, required: false, length: null },
        value: undefined,
      },
    });
  });

  it('should matched related fields', () => {
    const adapter = new ModelAdapter({} as IModelService);
    const fields = adapter.getFormSchema(
      {
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
      'test_schema',
      { test_related_id: 1 },
    );
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
    const adapter = new ModelAdapter({} as IModelService);
    const fieldsWithNullable = adapter.getFormSchema(
      {
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
      'test_schema',
      { 'test-nullable': 1 },
    );

    expect(fieldsWithNullable).toEqual({
      'test-nullable': {
        name: 'test-nullable',
        options: {
          selectable: undefined,
          required: false,
          length: 50,
          label: null,
        },
        ref: 'test-nullable',
        type: 'InputNumber',
        value: 1,
      },
    });

    const fieldsWithRequired = adapter.getFormSchema(
      {
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
      'test_schema',
      { 'test-nullable': 1 },
    );

    expect(fieldsWithRequired).toEqual({
      'test-nullable': {
        name: 'test-nullable',
        options: {
          selectable: undefined,
          required: true,
          label: null,
          length: 50,
        },
        ref: 'test-nullable',
        type: 'InputNumber',
        value: 1,
      },
    });

    const fieldsWithRequiredInInfo = adapter.getFormSchema(
      {
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
      'test_schema',
      { 'test-nullable': 1 },
    );

    expect(fieldsWithRequiredInInfo).toEqual({
      'test-nullable': {
        name: 'test-nullable',
        options: {
          selectable: undefined,
          required: true,
          label: null,
          length: 50,
        },
        ref: 'test-nullable',
        type: 'InputNumber',
        value: 1,
      },
    });

    const fieldsWithRequiredInInfoConflict = adapter.getFormSchema(
      {
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
      'test_schema',
      { 'test-nullable': 1 },
    );

    expect(fieldsWithRequiredInInfoConflict).toEqual({
      'test-nullable': {
        name: 'test-nullable',
        options: {
          selectable: undefined,
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

describe('listSchemasCallable', () => {
  it('should return future callable functions', () => {
    const adapter = new ModelAdapter(
      {
        loadSchema: ({ token }, name, config) => ({ token, name, config }),
      } as IModelService,
      {
        // tableColumns,
        // modelColumns,
        models: {
          abouts: {},
          about_categories: {},
          admin__users: {
            endpoint: 'admin/auth/users',
          },
          admin__roles: {
            endpoint: 'admin/auth/roles',
          },
        },
      },
    );
    const schemasCallable = adapter.listSchemasCallable({ token: 'test-token' });
    expect(Object.keys(schemasCallable)).toEqual([
      'abouts',
      'about_categories',
      'admin__users',
      'admin__roles',
    ]);
  });
});
