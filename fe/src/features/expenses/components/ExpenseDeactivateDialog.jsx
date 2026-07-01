import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/chadcn/Button';
import Dialog from '@/components/chadcn/Dialog';
import { EXPENSE_TEXT, getApiErrorMessage } from '@/features/expenses/constants';
import useDeactivateExpense from '@/features/expenses/hooks/useDeactivateExpense';

export default function ExpenseDeactivateDialog({ isOpen, onClose, expense, onSuccess }) {
  const deactivateMutation = useDeactivateExpense();
  const [errorMessage, setErrorMessage] = useState('');
  const isDeactivating = deactivateMutation.isLoading || deactivateMutation.isPending;

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      deactivateMutation.reset();
    }
  }, [isOpen]);

  const footer = useMemo(
    () => (
      <>
        <Button type="button" variant="ghost" onClick={onClose}>
          {EXPENSE_TEXT.deactivateDialog.cancel}
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={isDeactivating || !expense?.id}
          onClick={() => {
            if (!expense?.id) {
              return;
            }

            setErrorMessage('');
            deactivateMutation.mutate(expense.id, {
              onSuccess: () => {
                onSuccess(EXPENSE_TEXT.success.deactivated(expense.vendor));
                onClose();
              },
              onError: (error) =>
                setErrorMessage(getApiErrorMessage(error, EXPENSE_TEXT.deactivateDialog.error)),
            });
          }}
        >
          {EXPENSE_TEXT.deactivateDialog.confirm}
        </Button>
      </>
    ),
    [deactivateMutation, expense, isDeactivating, onClose, onSuccess]
  );

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={EXPENSE_TEXT.deactivateDialog.title}
      footer={footer}
    >
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          {EXPENSE_TEXT.deactivateDialog.description(expense?.vendor ?? '')}
        </p>
        {errorMessage ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}

ExpenseDeactivateDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  expense: PropTypes.shape({
    id: PropTypes.string,
    vendor: PropTypes.string,
  }),
  onSuccess: PropTypes.func.isRequired,
};

ExpenseDeactivateDialog.defaultProps = {
  expense: null,
};
