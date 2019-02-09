import { Dispatch } from 'redux';

declare global {
  namespace NodeJS {
    interface Global {}
  }

  type DeepPartial<T> = { [K in keyof T]?: DeepPartial<T[K]> };

  interface SagaParams {
    payload: object;

    cb?(...any): any;
  }

  interface ReduxProps {
    dispatch: Dispatch;
  }

  type Sorter = {
    [key: string]: 'asc' | 'desc';
  };

  type FormField = {
    name: string;
    includes: object;
  };

  type AntdFormOnChangeListener = {
    onChange: (changedFields: any) => any;
  };
}
