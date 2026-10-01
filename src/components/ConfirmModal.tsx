'use client';

import React from 'react';
import { X, AlertTriangle, AlertCircle, Info } from 'lucide-react';
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
          borderColor: 'border-rose-500/50',
          borderColorInline: 'rgba(244, 63, 94, 0.55)',
          glowClass: 'shadow-rose-950/40',
          iconBg: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
          defaultIcon: <AlertCircle className="w-5 h-5 text-rose-400" />,
          confirmBtn:
            'bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-950/50',
        };
      case 'info':
        return {
          borderColor: 'border-sky-500/40',
          borderColorInline: 'rgba(56, 189, 248, 0.45)',
          glowClass: 'shadow-sky-950/30',
          iconBg: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
          defaultIcon: <Info className="w-5 h-5 text-sky-400" />,
          confirmBtn:
            'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-950/40',
        };
      case 'warning':
      default:
        return {
          borderColor: 'border-amber-500/40',
          borderColorInline: 'rgba(245, 158, 11, 0.45)',
          glowClass: 'shadow-amber-950/40',
          iconBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
          defaultIcon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
          confirmBtn:
            'bg-gradient-to-r from-amber-500 via-red-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white shadow-lg shadow-amber-950/40',
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
      className={`relative m-auto w-[calc(100%-2rem)] max-w-lg rounded-3xl border-2 ${styles.borderColor} bg-slate-900 p-6 sm:p-7 shadow-2xl ${styles.glowClass} text-white outline-none overflow-hidden`}
      style={{
        backgroundColor: '#0f172a',
        borderColor: styles.borderColorInline,
        borderWidth: '2px',
        borderStyle: 'solid',
        maxWidth: '30rem', // 480px compact form card
        width: 'calc(100% - 2rem)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 25px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Top Header: Icon + Title + Close Button */}
      <div className="flex items-start justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${styles.iconBg}`}>
            {icon || styles.defaultIcon}
          </div>
          <h3 id="confirm-modal-title" className="text-lg sm:text-xl font-black text-white tracking-tight">
            {title}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="p-1.5 -mr-1 -mt-1 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition disabled:opacity-50 shrink-0"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Description Message */}
      <p id="confirm-modal-description" className="text-sm text-slate-300 leading-relaxed mb-6 font-medium">
        {description}
      </p>

      {/* Action Buttons Row */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
        {!isAlert && (
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition disabled:opacity-50"
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
