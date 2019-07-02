import React, { useState } from 'react';
import { Document, Page } from 'react-pdf';
import * as _ from 'lodash';
import { Icon } from 'antd';
// import { Document, Page } from "react-pdf/dist/entry.webpack";
import { FlexCenterBox, ThumbImage } from './Styled';
import { joinUrl, valueToUrl } from '@asuna-admin/core/url-rewriter';

interface IAssetsPreviewProps {
  host?: string;
  urls: string[];
  showPdf?: boolean;
}

export function AssetsPreview({ host, urls, showPdf }: IAssetsPreviewProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', maxWidth: '400px' }}>
      {_.map(urls, image => (
        <AssetPreview key={image} host={host} url={image} showPdf={showPdf} />
      ))}
    </div>
  );
}

interface IAssetPreviewProps {
  host?: string;
  url: string;
  showPdf?: boolean;
  fullWidth?: boolean;
}

interface IAssetPreviewState {
  numPages: number | null;
  pageNumber: number;
  loading: boolean;
}

export function AssetPreview({ host, url, showPdf, fullWidth }: IAssetPreviewProps) {
  const [state, setState] = useState<IAssetPreviewState>({
    numPages: null,
    pageNumber: 1,
    loading: true,
  });
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
      <React.Fragment>
        {!state.loading && (
          <div>
            <a href={href} target="_blank">
              <Icon type="file-pdf" style={{ fontSize: '2rem', padding: '1rem' }} />
            </a>
            Total pages is {state.numPages}, preview first page:
          </div>
        )}
        <FlexCenterBox key={url}>
          <a href={href} target="_blank">
            <Document file={href} onLoadSuccess={onDocumentLoadSuccess}>
              <Page pageNumber={state.pageNumber} weight={fullWidth ? null : 200} />
            </Document>
          </a>
        </FlexCenterBox>
      </React.Fragment>
    ) : (
      <FlexCenterBox>
        <a href={href} target="_blank">
          <Icon type="file-pdf" style={{ fontSize: '2rem', padding: '1rem' }} />
        </a>
      </FlexCenterBox>
    );
  }
  return (
    <FlexCenterBox key={url}>
      <a href={href} target="_blank">
        {/*<ThumbImage src={`${host}${url}?thumbnail/x80_cover`} />*/}
        <ThumbImage
          width={fullWidth ? '100%' : ''}
          src={valueToUrl(url, { type: 'image', thumbnail: { height: 200, width: 200 } })}
        />
      </a>
    </FlexCenterBox>
  );
}
