'use client';

import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useHtmlDialog } from '@/hooks/useHtmlDialog';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  icon?: React.ReactNode;
  isLoading?: boolean;
  isAlert?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  icon,
  isLoading = false,
  isAlert = false,
}: ConfirmModalProps) {
  const { dialogRef, handleCancel, handleClick } = useHtmlDialog({
    isOpen,
    onClose,
  });

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
          confirmBtn:
            'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-950/40',
        };
      case 'info':
        return {
          iconBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
          confirmBtn:
            'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-950/40',
        };
      case 'warning':
      default:
        return {
          iconBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
          confirmBtn:
            'bg-gradient-to-r from-amber-500 via-red-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white shadow-lg shadow-amber-950/30',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      onCancel={handleCancel}
      onClick={handleClick}
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-description"
      className="relative w-[calc(100%-2rem)] max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl m-auto text-white outline-none"
    >
      <button
        type="button"
        onClick={onClose}
        disabled={isLoading}
        className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition disabled:opacity-50"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-3.5 mb-3">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${styles.iconBg}`}>
          {icon || <AlertTriangle className="w-5 h-5" />}
        </div>
        <h3 id="confirm-modal-title" className="text-lg font-black text-white tracking-tight">
          {title}
        </h3>
      </div>

      <p id="confirm-modal-description" className="text-sm text-slate-300 leading-relaxed mb-6">
        {description}
      </p>

      <div className="flex items-center justify-end gap-3">
        {!isAlert && (
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition disabled:opacity-50"
          >
            {cancelText}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            onConfirm();
          }}
          disabled={isLoading}
          className={`px-5 py-2.5 rounded-xl text-xs font-black transition disabled:opacity-50 ${styles.confirmBtn}`}
        >
          {isLoading ? 'Processing...' : isAlert ? (confirmText === 'Confirm' ? 'OK' : confirmText) : confirmText}
        </button>
      </div>
    </dialog>
  );
}
