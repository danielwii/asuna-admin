interface GlobalState {
  type: string;
  payload: object;
  key: string;
}

export interface RootState {
  global?: GlobalState;
}
