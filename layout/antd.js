import React    from 'react';
import NextHead from 'next/head';

export default ({ children }) => (
  <div>
    <NextHead>
      <link rel="icon" type="image/png" sizes="32x32" href="/static/icons/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/static/icons/favicon-16x16.png" />
      <link rel="stylesheet" href="/static/libs/antd.css" />
      <link rel="stylesheet" href="/static/libs/draft.css" />
      <link rel="stylesheet" href="/static/libs/braft.css" />
    </NextHead>
    {children}
  </div>
);
