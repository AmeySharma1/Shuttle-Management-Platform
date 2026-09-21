'use client';

import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

/** ConfirmDialog — Destructive action confirmation dialog with clean SaaS styling. */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  variant = 'danger',
  loading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div className="w-11 h-11 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-[#F5F7FF]">{title}</h3>
          <p className="text-xs text-[#7E87A6] mt-1 leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-2.5 w-full mt-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant={variant}
            className="flex-1"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
