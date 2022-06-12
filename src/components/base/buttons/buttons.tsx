import { Button, Modal, Popconfirm, Tooltip } from 'antd';
import _ from 'lodash';
import React, { useState } from 'react';

import type { ButtonProps } from 'antd/es/button';
import type { PopconfirmProps } from 'antd/es/popconfirm';
import type { TooltipProps } from 'antd/es/tooltip';

type WordingType = 'Submit' | 'Submitting' | 'Submitted';

export type DefaultButton = Omit<ButtonProps, 'onClick'> & {
  confirmProps?: PopconfirmProps;
  tooltipProps?: TooltipProps;
  disableAfterSubmitted?: boolean;
  handleOk?: () => void;
};
export interface NormalButton {
  onClick: () => Promise<any>;
}
export interface ModalButton {
  builder: ({ onOk, cancel }) => React.ReactNode;
}
export type AdvancedButton<T> = DefaultButton & T;

function isNormalButton(props: any): props is AdvancedButton<NormalButton> {
  return !!props.onClick;
}

function isModalButton(props: any): props is AdvancedButton<ModalButton> {
  return !!props.builder;
}

export const AdvancedButton: React.FC<AdvancedButton<NormalButton | ModalButton>> = (props) => {
  const { children, handleOk, disableAfterSubmitted, confirmProps, tooltipProps, ...otherProps } = props;
  const buttonProps = _.omit(otherProps, 'builder');

  const [loading, setLoading] = useState(false);
  const [wording, setWording] = useState<WordingType>('Submit');

  const [visible, setVisible] = useState(false);

  const handleConfirm = (e?: React.MouseEvent<HTMLElement>) => {
    setLoading(true);
    setWording('Submitting');
    (props as NormalButton).onClick().then(() => {
      setLoading(false);
      setWording('Submitted');
    });
  };

  const func = {
    showModal: () => setVisible(true),
    hideModal: () => setVisible(false),
    confirm: (e) => !confirmProps && (isNormalButton(props) ? handleConfirm(e) : setVisible(true)),
    popConfirm: (e) => (isNormalButton(props) ? handleConfirm(e) : setVisible(true)),
  };

  const view = (
    <Button
      {...buttonProps}
      loading={loading}
      onClick={func.confirm}
      disabled={disableAfterSubmitted && wording === 'Submitted'}
    >
      {children ?? wording}
    </Button>
  );

  const modal = isModalButton(props) ? (
    <Modal
      title="Basic Modal"
      visible={visible}
      onCancel={func.hideModal}
      okButtonProps={{ hidden: true }}
      cancelButtonProps={{ hidden: true }}
    >
      {props.builder({ onOk: handleOk, cancel: func.hideModal })}
    </Modal>
  ) : null;

  const withTooltipView = tooltipProps ? <Tooltip {...tooltipProps}>{view}</Tooltip> : view;

  return confirmProps ? (
    <>
      <Popconfirm {...confirmProps} onConfirm={func.popConfirm}>
        {withTooltipView}
      </Popconfirm>
      {modal}
    </>
  ) : (
    <>
      {withTooltipView}
      {modal}
    </>
  );
};
