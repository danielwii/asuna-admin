import { Button, Modal } from 'antd';
import React, { useState } from 'react';

export const ModalButtonBuilder: React.FC<{ handleOk: () => void; builder: () => React.ReactNode }> = ({
  handleOk,
  builder,
}) => {
  const [visible, setVisible] = useState(false);

  const _show = () => setVisible(true);
  const _handleCancel = () => setVisible(false);

  return (
    <div>
      <Button type="primary" onClick={_show}>
        Open Modal
      </Button>
      <Modal title="Basic Modal" visible={visible} onOk={handleOk} onCancel={_handleCancel}>
        {builder()}
      </Modal>
    </div>
  );
};
