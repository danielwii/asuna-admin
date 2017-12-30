import React    from 'react';
import NextHead from 'next/head';

export default ({ children }) => (
  <div>
    <NextHead>
      <link rel="icon" type="image/png" sizes="32x32" href="/static/icons/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/static/icons/favicon-16x16.png" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/antd/3.1.0/antd.css" />
    </NextHead>
    {children}
  </div>
);
