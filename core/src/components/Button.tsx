import { Button, Popconfirm } from 'antd';
import { ButtonProps } from 'antd/es/button/button';
import { PopconfirmProps } from 'antd/lib/popconfirm';
import * as React from 'react';
import { useState } from 'react';

export const AdvancedButton: React.FC<ButtonProps & { popConfirmProps?: PopconfirmProps }> = ({
  children,
  popConfirmProps,
  ...baseButtonProps
}) => {
  const [loading, setLoading] = useState(false);

  const view = (
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

  if (popConfirmProps) {
    return (
      <Popconfirm
        {...popConfirmProps}
        onConfirm={async e => {
          setLoading(true);
          await popConfirmProps?.onConfirm?.(e);
          setLoading(false);
        }}
      >
        {view}
      </Popconfirm>
    );
  }

  return view;
};
