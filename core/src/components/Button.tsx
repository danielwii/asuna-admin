import { Button } from 'antd';
import { ButtonProps } from 'antd/es/button/button';
import * as React from 'react';
import { useState } from 'react';

export const LoadingButton: React.FC<ButtonProps> = ({ children, ...baseButtonProps }) => {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      {...baseButtonProps}
      onClick={async e => {
        setLoading(true);
        await baseButtonProps?.onClick?.(e);
        setLoading(false);
      }}
      loading={loading}
    >
      {children}
    </Button>
  );
};
