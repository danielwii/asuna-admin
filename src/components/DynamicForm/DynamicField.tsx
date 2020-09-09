import * as React from 'react';
import { useState } from 'react';

interface IDynamicFieldProps {}
interface IDynamicFieldState {}

export function DynamicField(props: IDynamicFieldProps) {
  const {} = props;
  const [state, setState] = useState<IDynamicFieldState>({});

  return <div>dynamic field</div>;
}
