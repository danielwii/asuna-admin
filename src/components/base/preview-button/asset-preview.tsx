/** @jsxRuntime classic */

/** @jsx jsx */
// noinspection ES6UnusedImports
import { FilePdfOutlined } from '@ant-design/icons';
import { css, jsx } from '@emotion/react';
import { faker } from '@faker-js/faker';

import { parseJSONIfCould } from '@danielwii/asuna-helper/dist/utils';

import { Button, Divider, Input, List, Modal, Tooltip } from 'antd';
import * as _ from 'lodash';
import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow as styles } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import useMountedState from 'react-use/lib/useMountedState';

// import styles from 'prism-themes/themes/prism-synthwave84.css';
import { WithDebugInfo } from '../debug/debug';
import { FlexCenterBox, ThumbImage } from '../styled/styled';

import type { Document, Page } from 'react-pdf';

export const WithModal: React.FC<
  React.PropsWithChildren<{
    title?: string;
    renderModal: ({ state, setState, setVisible }) => React.ReactNode;
  }>
> = ({ title, renderModal, children }) => {
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState<any>();
  return (
    <React.Fragment>
      <Modal open={visible} footer={null} onCancel={() => setVisible(false)} closable={false}>
        {renderModal({ state, setState, setVisible })}
      </Modal>
      <Tooltip title={title}>
        <div
          css={css`
            display: inline-block;
            text-align: center;
          `}
          onClick={() => setVisible(true)}
        >
          {children}
        </div>
      </Tooltip>
    </React.Fragment>
  );
};

export const ImagePreview: React.FC<
  React.PropsWithChildren<{ url: string; title?: string; onEdit?: (url: string) => void }>
> = ({ title, url, onEdit, children }) => {
  const [newUrl, setUrl] = useState(url);
  const [visible, setVisible] = useState(false);
  const editView = onEdit ? (
    <div
      css={css`
        margin: 1rem 0;
        text-align: right;
      `}
    >
      <Input.TextArea value={newUrl ?? url} onChange={(e) => setUrl(e.target.value)} autoSize />
      <Divider type="horizontal" dashed style={{ margin: '1rem 0' }} />
      <Button
        type="primary"
        onClick={() => {
          onEdit(newUrl ?? url);
          setVisible(false);
        }}
      >
        Confirm
      </Button>
    </div>
  ) : null;
  return (
    <React.Fragment>
      <Modal visible={visible} footer={null} onCancel={() => setVisible(false)} closable={false}>
        <div
          css={css`
            display: flex;
            justify-content: center;
            box-shadow: 0 0 1rem #ccc;
          `}
        >
          <img
            css={css`
              max-width: 100%;
            `}
            src={newUrl ?? url}
          />
        </div>
        {editView}
      </Modal>
      <Tooltip title={title}>
        <div
          css={css`
            text-align: center;
          `}
          onClick={() => setVisible(true)}
        >
          {children}
        </div>
      </Tooltip>
    </React.Fragment>
  );
};

export const PdfButton: React.FC<{ pdf?: string; name?: string; title?: string }> = ({ pdf, name, title }) =>
  pdf ? (
    <Tooltip title="按住 option/ctrl 下载">
      <Button type="dashed" size="small" href={pdf} target="_blank" download={name}>
        {title ?? '查看 pdf'}
      </Button>
    </Tooltip>
  ) : (
    <React.Fragment>无 pdf</React.Fragment>
  );

export function AssetsPreview({
  host,
  urls,
  showPdf,
  viewer,
  fullWidth,
  renderExtraActions,
  renderImage,
  children,
}: {
  host?: string;
  urls: string[];
  showPdf?: boolean;
  viewer?: 'modal';
  fullWidth?: boolean;
  renderExtraActions?: (url: string, index: number, total: number) => React.ReactNode;
  renderImage?: (props: { view: React.ReactNode; index: number }) => React.ReactNode;
  children?: (props: { view: React.ReactNode; index: number }) => React.ReactNode;
}) {
  const renderView = (url: string, index: number) => (
    <ImagePreview key={url} url={url}>
      <div
        css={css`
          display: inline-block;
          cursor: pointer;
          margin: 0.5rem;
          //border-radius: 0.2rem;
          //overflow: hidden;
          box-shadow: 0 0 0.1rem #eee;
          :hover {
            box-shadow: 0 0 0.5rem #ccc;
          }
        `}
      >
        {renderImage ? renderImage({ view: <ThumbImage src={url} />, index }) : <ThumbImage src={url} />}
      </div>
    </ImagePreview>
  );

  return (
    <div
      style={
        fullWidth ? { display: 'flex', flexWrap: 'wrap' } : { display: 'flex', flexWrap: 'wrap', maxWidth: '400px' }
      }
    >
      {_.map(urls, (url, index) => (
        <div key={`viewer-${index}`}>
          {children ? children({ view: renderView(url, index), index }) : renderView(url, index)}
          <div
            css={css`
              text-align: center;
            `}
          >
            <div
              css={css`
                padding: 0.2rem 0.5rem;
              `}
            >
              {/* <TooltipContent value={url} link /> */}
              {renderExtraActions?.(url, index, urls.length)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export interface IAssetPreviewProps {
  host?: string;
  url: string;
  width?: number;
  height?: number;
  showPdf?: boolean;
  fullWidth?: boolean;
}

interface IAssetPreviewState {
  numPages: number | null;
  pageNumber: number;
  loading: boolean;
}

export const AssetPreview: React.FC<IAssetPreviewProps> = ({ url, width, height, showPdf, fullWidth }) => {
  const isMounted = useMountedState();
  const [state, setState] = useState<IAssetPreviewState>({ numPages: null, pageNumber: 1, loading: true });
  const href = url;

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
    let view;
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Document, Page } = require('react-pdf');
      view = (
        <Document file={href} onLoadSuccess={onDocumentLoadSuccess}>
          <Page pageNumber={state.pageNumber} width={fullWidth ? (null as any) : width ?? 200} />
        </Document>
      );
    }
    // const view = R.ifElse(
    //   R.identity,
    //   () => {
    //     const { Document, Page } = require('react-pdf');
    //     return (
    //       <Document file={href} onLoadSuccess={onDocumentLoadSuccess}>
    //         <Page pageNumber={state.pageNumber} width={fullWidth ? (null as any) : width ?? 200} />
    //       </Document>
    //     );
    //   },
    //   () => null,
    // )(isMounted() && window);
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
            {view}
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
      <ThumbImage height={height} width={fullWidth ? '100%' : ''} src={url} />
    </FlexCenterBox>
  );
};

export const MATCH_REGEX = /{{([^{}]+)}}/g;

export const Preview: React.FC<{
  text: string;
  tmplFields?: { name: string; help?: string; fake?: string }[];
  listMode?: boolean;
  jsonMode?: boolean;
  htmlMode?: boolean;
  language?: string;
}> = ({ text, tmplFields, listMode, jsonMode, htmlMode, language }) => {
  const rendered = _.replace(text, MATCH_REGEX, (substring) => {
    const field = _.find(tmplFields, (field) => `{{${field.name}}}` === substring);
    let rendered = substring;
    try {
      rendered = faker.fake(`{{${field?.fake}}}`);
    } catch (e) {}
    return rendered;
  });

  if (language) {
    return (
      <React.Fragment>
        <SyntaxHighlighter
          language={language}
          style={styles}
          customStyle={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 'inherit' }}
        >
          {rendered}
        </SyntaxHighlighter>
      </React.Fragment>
    );
  }

  if (listMode) {
    const dataSource = _.map(parseJSONIfCould(text), (description, title) => ({ title, description }));
    return (
      <List
        size="small"
        dataSource={dataSource}
        renderItem={({ title, description }) => (
          <List.Item>
            {title}: {description}
          </List.Item>
        )}
      />
    );
  }

  if (jsonMode) {
    let wrapped = rendered;
    // let backgroundColor = 'gray';
    try {
      wrapped = JSON.stringify(JSON.parse(rendered), null, 2);
      // backgroundColor = '#272336';
    } catch (e) {}

    return (
      <React.Fragment>
        <SyntaxHighlighter
          language="json"
          style={styles}
          customStyle={{ /* backgroundColor, */ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 'inherit' }}
        >
          {wrapped}
        </SyntaxHighlighter>
      </React.Fragment>
    );
  }

  if (htmlMode) {
    return (
      <React.Fragment>
        <Button
          size="small"
          type="dashed"
          onClick={() =>
            Modal.info({
              maskClosable: true,
              width: '80%',
              content: <div dangerouslySetInnerHTML={{ __html: rendered }} />,
            })
          }
        >
          预览
        </Button>
        <Divider type="horizontal" dashed style={{ margin: '0.5rem 0' }} />
        <div
          css={css`
            border: 1px dashed #d9d9d9;
            border-radius: 2px;
          `}
          dangerouslySetInnerHTML={{ __html: rendered }}
        />
      </React.Fragment>
    );
  }

  return (
    <pre
      css={css`
        white-space: pre-wrap;
        word-break: break-word;
        background-color: ghostwhite;
        .tmpl__field {
          background-color: yellowgreen;
          line-height: 1.5rem;
          border: 1px dashed #d9d9d9;
          border-radius: 2px;
          padding: 0.1rem 0.2rem;
          margin: 0 0.1rem;
          &.warning {
            background-color: goldenrod;
          }
        }
      `}
      dangerouslySetInnerHTML={{
        __html: _.replace(text, MATCH_REGEX, (substring) => {
          const field = _.find(tmplFields, (field) => `{{${field.name}}}` === substring);
          let rendered = substring;
          try {
            rendered = faker.fake(`{{${field?.fake}}}`);
          } catch (e) {}
          return `<span class="tmpl__field ${field ? '' : 'warning'}">${rendered}</span>`;
        }),
      }}
    />
  );
};
