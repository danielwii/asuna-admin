import styled from 'styled-components';
import * as React from 'react';
import { ComponentClass } from 'react';

export const FlexCenterBox = (styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #f5f5f5;
  border-radius: 0.2rem;
  padding: 0.1rem;
  margin: 0.1rem;
` as any) as ComponentClass<{} & React.HTMLAttributes<{}>>;

interface IThumbImage {
  width?: string | number;
  height?: string | number;
}

export const ThumbImage = (styled.img`
  max-width: ${({ width }) => width || '200px'};
  max-height: ${({ width }) => width || '80px'};
` as any) as ComponentClass<IThumbImage & React.ImgHTMLAttributes<{}>>;

interface IHighlightTitle {
  highlight: boolean;
}

export const Title = (styled.span`
  font-weight: ${(props: IHighlightTitle) => (props.highlight ? 'bold' : 'inherit')};
` as any) as ComponentClass<IHighlightTitle & React.HTMLAttributes<{}>>;
