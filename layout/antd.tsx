import React    from 'react';
import NextHead from 'next/head';

export default ({ children }) => (
  <div>
    <NextHead>
      <link rel="icon" type="image/png" sizes="32x32" href="/static/icons/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/static/icons/favicon-16x16.png" />

      <link rel="preload" as="style" href="/static/libs/antd.css" />
      <link rel="preload" as="style" href="/static/libs/draft.css" />
      <link rel="preload" as="style" href="/static/libs/braft.css" />
      <link rel="preload" as="style" href="/static/libs/video-js.css" />

      <link rel="stylesheet" href="/static/libs/antd.css" />
      <link rel="stylesheet" href="/static/libs/draft.css" />
      <link rel="stylesheet" href="/static/libs/braft.css" />
      <link rel="stylesheet" href="/static/libs/video-js.css" />
    </NextHead>
    {children}
  </div>
);
