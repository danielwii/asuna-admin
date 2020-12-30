import React from 'react';
import Document, { DocumentContext, Head, Html, Main, NextScript } from 'next/document';
import { ServerStyleSheet } from 'styled-components';

export class StyledDocument extends Document {
  props: any;

  static async getInitialProps(ctx: DocumentContext) {
    // Step 1: Create an instance of ServerStyleSheet
    const sheet = new ServerStyleSheet();

    const originalRenderPage = ctx.renderPage;
    ctx.renderPage = () =>
      originalRenderPage({
        enhanceApp: (App) => (props) =>
          // Step 2: Retrieve styles from components in the page
          sheet.collectStyles(<App {...props} />),
      });

    const initialProps: any = await Document.getInitialProps(ctx);

    // Step 3: Extract the styles as <style> tags
    const styleTags = sheet.getStyleElement();

    // Returns an object like: { html, head, errorHtml, chunks, styles }
    return { ...initialProps, styles: [...initialProps.styles, ...styleTags] };
  }

  render() {
    return (
      <Html lang="zh">
        <meta charSet="utf-8" />
        <Head>{this.props.styleTags}</Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
