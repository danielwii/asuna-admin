import { Dispatch } from 'redux';

interface SagaParams {
  payload: object;

  cb?(...any): any;
}

interface ReduxProps {
  dispatch: Dispatch;
}
