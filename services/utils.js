import _ from 'lodash';

export const extractPageable = apiResponse => _.pick(apiResponse, [
  'first',
  'last',
  'number',
  'numberOfElements',
  'size',
  'sort',
  'totalElements',
  'totalPages',
]);

export const toPagination = (apiResponse) => {
  const { size, number, totalElements } = extractPageable(apiResponse);
  return {
    showSizeChanger: true,
    showTotal      : (total, range) => `${range[0]}-${range[1]} of ${total} items`,
    current        : number,
    pageSize       : size,
    total          : totalElements,
    pageSizeOptions: ['10', '25', '50', '100'],
  };
};
