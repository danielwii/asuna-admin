import { ColumnProps } from 'antd/es/table';

export type RelationColumnProps<T = any> = ColumnProps<T> & { relation: string };
