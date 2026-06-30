import PropTypes from 'prop-types';
import { useEffect } from 'react';
import Button from '@/components/chadcn/Button';
import AlertIcon from '@/components/chadcn/icons/AlertIcon';
import CheckIcon from '@/components/chadcn/icons/CheckIcon';
import XIcon from '@/components/chadcn/icons/XIcon';
import useToast from '@/components/chadcn/useToast';

const TOAST_TEXT = {
  dismiss: 'Dismiss notification',
};

const TOAST_VARIANTS = {
  success: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  error: 'border-rose-100 bg-rose-50 text-rose-700',
};

export default function Toast({ toast, onDismiss }) {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => onDismiss(toast.id), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [onDismiss, toast.id]);

  return (
    <div
      className={`flex min-w-[280px] max-w-sm items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${TOAST_VARIANTS[toast.type] ?? TOAST_VARIANTS.success}`}
      role="status"
      aria-live="polite"
    >
      <span className="mt-0.5 text-base" aria-hidden="true">
        {toast.type === 'error' ? <AlertIcon /> : <CheckIcon />}
      </span>
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <Button
        type="button"
        variant="ghost"
        onClick={() => onDismiss(toast.id)}
        className="rounded-full p-1 text-current hover:bg-white/70"
        aria-label={TOAST_TEXT.dismiss}
      >
        <XIcon />
      </Button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-3">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onDismiss={dismissToast} />
        </div>
      ))}
    </div>
  );
}

Toast.propTypes = {
  toast: PropTypes.shape({
    id: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['success', 'error']).isRequired,
  }).isRequired,
  onDismiss: PropTypes.func.isRequired,
};
