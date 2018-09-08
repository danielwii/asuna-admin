import * as _ from 'lodash';

import { AppContext } from '@asuna-admin/core';
import { Config } from '@asuna-admin/config';
import { createLogger } from '@asuna-admin/logger';

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

export interface TablePagination {
  showSizeChanger: boolean;
  showTotal: number | Function;
  current: number;
  pageSize: number;
  total: number;
  pageSizeOptions: string[];
}

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

const logger = createLogger('adapters::response', 'warn');

export const responseProxy = {
  extract(apiResponse: object): { items: object[]; pagination: TablePagination } {
    return AppContext.ctx.response.extract(apiResponse);
  },
};

export class ResponseAdapter {
  extractPageable = (apiResponse): Asuna.Pageable & { total: number } => {
    switch (Config.get('API_RESPONSE_PAGE_MODE')) {
      case 'SpringJPA': {
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
      case 'SQLAlchemy': {
        const names = ['has_next', 'has_prev', 'items', 'page', 'pages', 'size', 'total'];

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
      showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
      current: page,
      pageSize: size,
      total: totalElements,
      pageSizeOptions: ['10', '25', '50', '100'],
    };
  };

  extract = (apiResponse): { items: object[]; pagination: TablePagination } => {
    const { items } = apiResponse;
    return { items, pagination: this.extractPagination(apiResponse) };
  };
}
