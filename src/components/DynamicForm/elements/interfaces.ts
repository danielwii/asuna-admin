export type FormComponentProps<T = any, FieldOptions = any> = {
  value: T;
  id: string;
  onChange: (...args) => void;
};
