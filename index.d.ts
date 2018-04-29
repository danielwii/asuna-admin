import { Dispatch } from 'redux';

declare global {
  interface SagaParams {
    payload: object;

    cb?(...any): any;
  }

  interface ReduxProps {
    dispatch: Dispatch;
  }
}
