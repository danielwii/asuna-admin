import styled from 'styled-components';
import { ComponentClass } from 'react';
import * as React from 'react';

export const FluxCenterBox = (styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #f5f5f5;
  border-radius: 0.2rem;
  padding: 0.1rem;
  margin: 0.1rem;
` as any) as ComponentClass<{} & React.HTMLAttributes<{}>>;

export const ThumbImage = (styled.img`
  max-width: ${({ width }) => width || '200px'};
  max-height: ${({ width }) => width || '80px'};
` as any) as ComponentClass<
  { width?: string | number; height?: string | number } & React.ImgHTMLAttributes<{}>
>;
