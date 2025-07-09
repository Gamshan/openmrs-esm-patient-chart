import React from 'react';
import { Modal } from '@carbon/react';

interface ConfirmCloseModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const ConfirmCloseModal: React.FC<ConfirmCloseModalProps> = ({ open, onCancel, onConfirm }) => {
  return (
    <Modal
      open={open}
      modalHeading="Confirm Close"
      primaryButtonText="Close"
      secondaryButtonText="Cancel"
      onRequestClose={onCancel}
      onRequestSubmit={onConfirm}
      danger
    >
      <p>Are you sure you want to close this item? You will not be able to see it after close.</p>
    </Modal>
  );
};

export default ConfirmCloseModal;
