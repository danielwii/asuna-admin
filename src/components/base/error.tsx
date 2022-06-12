import { CloseCircleOutlined } from '@ant-design/icons';

import { Result, Typography } from 'antd';
import React from 'react';

const { Paragraph } = Typography;

export interface IErrorInfoProps {
  title?: React.ReactNode;
  subTitle?: React.ReactNode;
  extra?: React.ReactNode;
}

export function ErrorInfo(props: IErrorInfoProps & { children?: React.ReactNode }) {
  const { title, subTitle, extra, children } = props;
  return (
    <Result status="error" title={title || 'Error'} subTitle={subTitle} extra={extra}>
      <div className="desc">
        <Paragraph>
          <CloseCircleOutlined style={{ color: 'red' }} /> {children}
        </Paragraph>
      </div>
    </Result>
  );
}
