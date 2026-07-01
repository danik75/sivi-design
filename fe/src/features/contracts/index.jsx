import { useState } from 'react';
import useToast from '@/components/chadcn/useToast';
import ContractDeactivateDialog from '@/features/contracts/components/ContractDeactivateDialog';
import ContractGrid from '@/features/contracts/components/ContractGrid';
import ContractModal from '@/features/contracts/components/ContractModal';

export default function ContractsFeature() {
  const { showToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [deactivateContract, setDeactivateContract] = useState(null);

  const handleSuccess = (message) => {
    showToast(message, 'success');
    setShowCreate(false);
    setDeactivateContract(null);
  };

  return (
    <>
      <ContractGrid
        onCreate={() => setShowCreate(true)}
        onDeactivate={(contract) => setDeactivateContract(contract)}
      />
      <ContractModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={handleSuccess}
      />
      <ContractDeactivateDialog
        isOpen={Boolean(deactivateContract)}
        onClose={() => setDeactivateContract(null)}
        contract={deactivateContract}
        onSuccess={handleSuccess}
      />
    </>
  );
}

ContractsFeature.propTypes = {};
