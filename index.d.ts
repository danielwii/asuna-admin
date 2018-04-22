interface SagaParams {
  payload: object;

  cb?(...any): any;
}
