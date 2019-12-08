import { Icon, Result, Typography } from 'antd';
import React, { ReactNode } from 'react';

const { Paragraph, Text } = Typography;

export interface IErrorInfoProps {
  title?: React.ReactNode;
  subTitle?: React.ReactNode;
  extra?: React.ReactNode;
}

export function ErrorInfo(props: IErrorInfoProps & { children?: ReactNode }) {
  const { title, subTitle, extra, children } = props;
  return (
    <Result status="error" title={title || 'Error'} subTitle={subTitle} extra={extra}>
      <div className="desc">
        <Paragraph>
          <Icon style={{ color: 'red' }} type="close-circle" /> {children}
        </Paragraph>
        {/*<Paragraph>
          <Text
            strong
            style={{
              fontSize: 16,
            }}
          >
            The content you submitted has the following error:
          </Text>
        </Paragraph>
        <Paragraph>
          <Icon style={{ color: 'red' }} type="close-circle" /> Your account has been frozen
          <a>Thaw immediately &gt;</a>
        </Paragraph>
        <Paragraph>
          <Icon style={{ color: 'red' }} type="close-circle" /> Your account is not yet eligible to apply{' '}
          <a>Apply Unlock &gt;</a>
        </Paragraph>*/}
      </div>
    </Result>
  );
}