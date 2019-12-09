import * as React from 'react';

export function SpanFormatter({ value }: { value: any; type: 'number' }) {
  return <span>{`${value as number}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span>;
}
