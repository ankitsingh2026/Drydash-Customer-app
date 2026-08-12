import { ConfirmDialog } from "@/components/Customalert";
import React from "react";

type CancelPickupConfirmModalProps = {
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function CancelPickupConfirmModal({
  visible,
  loading = false,
  onClose,
  onConfirm,
}: CancelPickupConfirmModalProps) {
  return (
    <ConfirmDialog
      visible={visible}
      config={{
        type: "error",
        title: "Cancel Pickup?",
        message:
          "Are you sure you want to cancel this pickup?",
        confirmLabel: loading ? "Cancelling…" : "Yes, Cancel",
        cancelLabel: "Keep Pickup",
        onConfirm,
        onCancel: onClose,
      }}
      onDismiss={onClose}
    />
  );
}
