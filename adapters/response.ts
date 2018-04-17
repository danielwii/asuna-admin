import * as _ from 'lodash';

import { ApiResponsePageMode, config, ConfigKeys } from '../app/configure';
import { appContext }                              from '../app/context';

export interface TablePagination {
  showSizeChanger: boolean;
  showTotal: number | Function;
  current: number;
  pageSize: number;
  total: number;
  pageSizeOptions: string[];
}

export interface Pageable {
  page: number;
  size: number;
  total: number;
}

export const responseProxy = {
  extract: apiResponse => appContext.ctx.response.extract(apiResponse),
};

export class ResponseAdapter {
  extractPageable = (apiResponse): Pageable => {
    switch (config.get(ConfigKeys.API_RESPONSE_PAGE_MODE)) {
      case (ApiResponsePageMode.SpringJPA): {
        const names = [
          'first',
          'last',
          'number',
          'numberOfElements',
          'size',
          'sort',
          'totalElements',
          'totalPages',
        ];

        const { size, number, totalElements } = _.pick(apiResponse, names);
        return { page: number, size, total: totalElements };
      }
      case (ApiResponsePageMode.SQLAlchemy): {
        const names = [
          'has_next',
          'has_prev',
          'items',
          'page',
          'pages',
          'size',
          'total',
        ];

        const { page, size, total } = _.pick(apiResponse, names);
        return { page, size, total };
      }
      default: {
        const names = ['elements', 'page', 'size', 'total'];

        const { page, size, total } = _.pick(apiResponse, names);
        return { page, size, total };
      }
    }
  };

  extractPagination = (apiResponse): TablePagination => {
    const { page, size, total: totalElements } = this.extractPageable(apiResponse);
    return {
      showSizeChanger: true,
      showTotal      : (total, range) => `${range[0]}-${range[1]} of ${total} items`,
      current        : page,
      pageSize       : size,
      total          : totalElements,
      pageSizeOptions: ['10', '25', '50', '100'],
    };
  };

  extract = (apiResponse): { items: any[], pagination: TablePagination } => {
    const { items } = apiResponse;
    return { items, pagination: this.extractPagination(apiResponse) };
  };
}
