import { Dispatch } from 'redux';

declare global {
  namespace NodeJS {
    interface Global {
      __asuna__: {};
    }
  }

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

  interface IFormFix {
    onChange: (changedFields: any) => any;
  }
}
