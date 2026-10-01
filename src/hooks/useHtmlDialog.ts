'use client';

import { useRef, useEffect, useCallback } from 'react';

interface UseHtmlDialogOptions {
  isOpen: boolean;
  onClose?: () => void;
}

export function useHtmlDialog({ isOpen, onClose }: UseHtmlDialogOptions) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        try {
          dialog.showModal();
        } catch {
          // Dialog might already be open or in a transitioning state
        }
      }
    } else {
      if (dialog.open) {
        try {
          dialog.close();
        } catch {
          // Dialog might already be closed
        }
      }
    }

    return () => {
      if (dialog && dialog.open) {
        try {
          dialog.close();
        } catch {
          // Cleanup on unmount
        }
      }
    };
  }, [isOpen]);

  const handleCancel = useCallback(
    (e: React.SyntheticEvent<HTMLDialogElement, Event>) => {
      e.preventDefault();
      onClose?.();
    },
    [onClose]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target !== dialogRef.current) return;
      const rect = dialogRef.current.getBoundingClientRect();
      const isInDialog =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;

      if (!isInDialog) {
        onClose?.();
      }
    },
    [onClose]
  );

  return {
    dialogRef,
    handleCancel,
    handleClick,
  };
}
