import React from 'react';

import Document, { Head, Main, NextScript } from 'next/document';
import { ServerStyleSheet } from 'styled-components';

export class StyledDocument extends Document {
  props: any;

  static getInitialProps({ renderPage }) {
    // Step 1: Create an instance of ServerStyleSheet
    const sheet = new ServerStyleSheet();

    // prettier-ignore
    // Next.js gives us a `transformPage` function
    // to be able to hook into the rendering of a page
    const transform = App => props =>
            // Step 2: Retrieve styles from components in the page
            sheet.collectStyles(<App {...props} />)
          // Same as:
          // return <StyleSheetManager sheet={sheet.instance}>
          //    <App/>
          // </StyleSheetManager>
    ;
    const page = renderPage(transform);

    // Step 3: Extract the styles as <style> tags
    const styleTags = sheet.getStyleElement();

    // Returns an object like: { html, head, errorHtml, chunks, styles }
    return { ...page, styleTags };
  }

  render() {
    return (
      <html lang="zh">
        <meta charSet="utf-8" />
        <Head>{this.props.styleTags}</Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </html>
    );
  }
}
