import styled from 'styled-components';

export const FlexCenterBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #f5f5f5;
  border-radius: 0.25rem;
  //padding: 0.1rem;
  margin: 0.1rem;
  overflow: hidden;
`;

interface IThumbImage {
  width?: string | number;
  height?: string | number;
}

export const RoundWrapper = styled.div`
  border-radius: 0.1rem;
  overflow: hidden;
  display: inline-block;
`;

export const ThumbImage = styled.img<IThumbImage>`
  max-width: ${({ width }) => width || '200px'};
  max-height: ${({ height }) => height || '120px'};
`;

interface IHighlightTitle {
  highlight: boolean;
}

export const Title = styled.span<IHighlightTitle>`
  font-weight: ${(props: IHighlightTitle) => (props.highlight ? 'bold' : 'inherit')};
`;

export const Content = styled.div`
  padding: 0.2rem;
  margin: 0.2rem;
`;
