import * as React from 'react';

import { Constants } from '../../core/constants';

export const nullProtectRender =
  (fn: (value, record) => React.ReactChild) =>
  (value, record): React.ReactChild =>
    record ? fn(value, record) : 'n/a';

export type ParseType =
  // TODO move to shared types
  // | 'ActivityStatus'
  // | 'ApplyStatus'
  // | 'ApplyStatusAction'
  // | 'EnrollmentStatus'
  // | 'EnrollmentStatusAction'
  // | 'Experience'
  // | 'InteractionType'
  // Common Types
  // | 'Degree'
  | 'Sex' | string;

export function parseType(key: ParseType, name: string | null): string {
  if (!name) return '';
  const value = Constants.constants?.[key]?.[name];
  if (!value) {
    console.warn('not found for constants', { key, name, map: Constants.constants?.[key] });
  }
  return value ?? name;
}
