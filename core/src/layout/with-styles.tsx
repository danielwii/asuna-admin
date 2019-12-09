import * as React from 'react';
import NextHead from 'next/head';
import getConfig from 'next/config';

import 'antd/dist/antd.css';
import 'draft-js/dist/Draft.css';
// import 'braft-editor/dist/index.css';
import 'video.js/dist/video-js.css';

export default ({ children, hideCharacteristics }) => (
  <div>
    <NextHead>
      <title>
        {hideCharacteristics ? '' : 'Asuna '}Admin : {getConfig().publicRuntimeConfig.env}
      </title>
      {/*<link rel="icon" type="image/png" sizes="32x32" href="/static/icons/favicon-32x32.png" />*/}
      {/*<link rel="icon" type="image/png" sizes="16x16" href="/static/icons/favicon-16x16.png" />*/}
    </NextHead>
    {children}
    {/* language=CSS */}
    <style jsx global>{`
      pre {
        font-size: 0.65rem;
      }
      .row-published {
        /*background-color: lavender;*/
      }
      .row-unpublished {
        color: darkred;
      }
    `}</style>
  </div>
);
