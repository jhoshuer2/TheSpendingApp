import { useEffect } from "react";

interface ToastProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
  /** How long it stays. Long enough to read and to undo. */
  ms?: number;
}

/** A short confirmation with an optional Undo. Announced to screen readers; floats above the bottom nav. */
export function Toast({ message, actionLabel, onAction, onClose, ms = 7000 }: ToastProps) {
  useEffect(() => {
    const t = window.setTimeout(onClose, ms);
    return () => window.clearTimeout(t);
  }, [message, ms, onClose]);
  return (
    <div className="toast enter" role="status">
      <span>{message}</span>
      {actionLabel && (
        <button
          type="button"
          className="toast__action"
          onClick={() => {
            onAction?.();
            onClose();
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
