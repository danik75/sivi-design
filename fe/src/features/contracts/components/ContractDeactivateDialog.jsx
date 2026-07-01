import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/chadcn/Button';
import Dialog from '@/components/chadcn/Dialog';
import { CONTRACT_TEXT, getApiErrorMessage } from '@/features/contracts/constants';
import useDeactivateContract from '@/features/contracts/hooks/useDeactivateContract';

export default function ContractDeactivateDialog({ isOpen, onClose, contract, onSuccess }) {
  const deactivateMutation = useDeactivateContract();
  const [errorMessage, setErrorMessage] = useState('');
  const isDeactivating = deactivateMutation.isLoading || deactivateMutation.isPending;

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      deactivateMutation.reset();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const footer = useMemo(
    () => (
      <>
        <Button type="button" variant="ghost" onClick={onClose}>
          {CONTRACT_TEXT.deactivateDialog.cancel}
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={isDeactivating || !contract?.id}
          onClick={() => {
            if (!contract?.id) {
              return;
            }

            setErrorMessage('');
            deactivateMutation.mutate(contract.id, {
              onSuccess: () => {
                onSuccess(CONTRACT_TEXT.success.deactivated(contract.name));
                onClose();
              },
              onError: (error) =>
                setErrorMessage(getApiErrorMessage(error, CONTRACT_TEXT.deactivateDialog.error)),
            });
          }}
        >
          {CONTRACT_TEXT.deactivateDialog.confirm}
        </Button>
      </>
    ),
    [contract, deactivateMutation, isDeactivating, onClose, onSuccess]
  );

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={CONTRACT_TEXT.deactivateDialog.title}
      footer={footer}
    >
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          {CONTRACT_TEXT.deactivateDialog.description(contract?.name ?? '')}
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

ContractDeactivateDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  contract: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
  }),
  onSuccess: PropTypes.func.isRequired,
};

ContractDeactivateDialog.defaultProps = {
  contract: null,
};
