import { schemaHelper } from '.';

test('schemaHelper.enumDecorator', () => {
  const decorated = schemaHelper.enumDecorator({
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
    refInclude: { name: 'refInclude', isFilterField: true, filter_type: 'Sort' },
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
