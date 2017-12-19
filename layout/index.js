import React from 'react';
import NextHead from 'next/head';

export default ({ children }) => (
  <div>
    <NextHead>
      <link rel="stylesheet" href="https://cdn.bootcss.com/antd/3.0.1/antd.css" />
    </NextHead>
    {children}
  </div>
);
