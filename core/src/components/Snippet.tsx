/** @jsx jsx */
import { FilePdfOutlined } from '@ant-design/icons';
import { joinUrl, valueToArrays } from '@asuna-admin/core/url-rewriter';
import { TooltipContent, WithDebugInfo } from '@asuna-admin/helpers';
import { jsx } from '@emotion/core';
import { Button, Tooltip } from 'antd';
import { Image } from 'asuna-components';
import * as _ from 'lodash';
import dynamic from 'next/dynamic';
import React from 'react';
import { Document, Page } from 'react-pdf';
import { ImageDecorator } from 'react-viewer/lib/ViewerProps';
import { FlexCenterBox } from './Styled';
// import { Document, Page } from "react-pdf/dist/entry.webpack";

const Viewer = dynamic(import('react-viewer'), { ssr: false });

export function ReactViewer({
  images,
  index,
  children,
}: { images: ImageDecorator[]; index: number } & { children?: React.ReactNode }) {
  const [visible, setVisible] = React.useState(false);

  return (
    <>
      <a onClick={() => setVisible(true)}>{children}</a>
      <Viewer
        activeIndex={index}
        visible={visible}
        onClose={() => setVisible(false)}
        onMaskClick={() => setVisible(false)}
        images={images}
        downloadable
        downloadInNewWindow
      />
    </>
  );
}

export const PdfButton: React.FC<{ pdf?: string }> = ({ pdf }) =>
  pdf ? (
    <Tooltip title="按住 option/ctrl 下载">
      <Button type="dashed" size="small" href={pdf} target="_blank">
        查看 pdf
      </Button>
    </Tooltip>
  ) : (
    <React.Fragment>无 pdf</React.Fragment>
  );

interface IAssetsPreviewProps {
  host?: string;
  urls: string[] | string;
  showPdf?: boolean;
  clearStyle?: boolean;
}

export function AssetsPreview({ host, urls, showPdf, clearStyle }: IAssetsPreviewProps) {
  const parsed = valueToArrays(urls);
  return (
    <div style={clearStyle ? {} : { display: 'flex', flexWrap: 'wrap', maxWidth: '400px' }}>
      {_.map(parsed, (url, index) => (
        <div key={`viewer-${index}`} style={{ display: 'inline-block' }}>
          <ReactViewer index={index} images={parsed.map(url => ({ src: url, downloadUrl: url }))}>
            <AssetPreview key={url} host={host} url={url} showPdf={showPdf} />
          </ReactViewer>
          <TooltipContent value={url} link />
        </div>
      ))}
    </div>
  );
}

interface IAssetPreviewProps {
  host?: string;
  url: string;
  width?: string;
  height?: string;
  showPdf?: boolean;
  fullWidth?: boolean;
}

interface IAssetPreviewState {
  numPages: number | null;
  pageNumber: number;
  loading: boolean;
}

export function AssetPreview({ host, url, width, height, showPdf, fullWidth }: IAssetPreviewProps) {
  const [state, setState] = React.useState<IAssetPreviewState>({ numPages: null, pageNumber: 1, loading: true });
  const href = joinUrl(host, url);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setState({ numPages, pageNumber: 1, loading: false });
  };

  /*
  const renderLeftPages = () =>
    state.pageNumber > 1 ? (
      _.times(state.pageNumber - 1, page => (
        <Page pageNumber={page + 1} weight={fullWidth ? null : 200} />
      ))
    ) : (
      <React.Fragment />
    );
*/

  if (/pdf$/.test(url)) {
    return showPdf ? (
      <WithDebugInfo info={state}>
        {!state.loading && (
          <div>
            <a href={href} target="_blank">
              <FilePdfOutlined style={{ fontSize: '2rem', padding: '1rem' }} />
            </a>
            {state.numPages} pages in total.
          </div>
        )}
        <FlexCenterBox key={url}>
          <a href={href} target="_blank">
            <Document file={href} onLoadSuccess={onDocumentLoadSuccess}>
              <Page pageNumber={state.pageNumber} width={fullWidth ? (null as any) : width ?? 200} />
            </Document>
          </a>
        </FlexCenterBox>
      </WithDebugInfo>
    ) : (
      <FlexCenterBox>
        <a href={href} target="_blank">
          <FilePdfOutlined style={{ fontSize: '2rem', padding: '1rem' }} />
        </a>
      </FlexCenterBox>
    );
  }
  return (
    <FlexCenterBox key={url}>
      <Image
        width={fullWidth ? '100%' : ''}
        height={height}
        // src={valueToUrl(url, { type: 'image', thumbnail: { height: height ?? 200, width: width ?? 200 } })}
        src={url}
      />
    </FlexCenterBox>
  );
}
