export type ColumnType = 'text';

export interface AsunaTableProps {
  dataSource: {}[];
  // renderItem: (item) => React.ReactElement;

  columns: { name: string; title?: string; type: ColumnType }[];
  onChange: (value) => void;
}
