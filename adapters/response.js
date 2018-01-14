import _ from 'lodash';

export const responseProxy = {
  extract: apiResponse => global.context.response.extract(apiResponse),
};

class ResponseAdapter {
  extractPagination = (apiResponse) => {
    const { page, size, total: totalElements } = this.extractPageable(apiResponse);
    return {
      showSizeChanger: true,
      showTotal      : (total, range) => `${range[0]}-${range[1]} of ${total} items`,
      current        : page,
      pageSize       : size,
      total          : totalElements,
      pageSizeOptions: ['10', '25', '50', '100'],
    };
  }
}

export class PyResponseAdapter extends ResponseAdapter {
  names = [
    'has_next',
    'has_prev',
    'items',
    'page',
    'pages',
    'size',
    'total',
  ];

  extractPageable = (apiResponse) => {
    const { page, size, total } = _.pick(apiResponse, this.names);
    return { page, size, total };
  };

  extract = (apiResponse) => {
    const { items } = apiResponse;
    return { items, pagination: this.extractPagination(apiResponse) };
  }
}

export class SpringResponseAdapter extends ResponseAdapter {
  names = [
    'first',
    'last',
    'number',
    'numberOfElements',
    'size',
    'sort',
    'totalElements',
    'totalPages',
  ];

  extractPageable = (apiResponse) => {
    const { size, number, totalElements } = _.pick(apiResponse, this.names);
    return { page: number, size, total: totalElements };
  };

  extract = (apiResponse) => {
    const { content } = apiResponse;
    return { items: content, pagination: this.extractPagination(apiResponse) };
  }
}
