import { useState } from 'react';
import useToast from '@/components/chadcn/useToast';
import ExpenseDeactivateDialog from '@/features/expenses/components/ExpenseDeactivateDialog';
import ExpenseGrid from '@/features/expenses/components/ExpenseGrid';
import ExpenseModal from '@/features/expenses/components/ExpenseModal';

export default function ExpensesFeature() {
  const { showToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [deactivateExpense, setDeactivateExpense] = useState(null);

  const handleSuccess = (message) => {
    showToast(message, 'success');
    setShowCreate(false);
    setDeactivateExpense(null);
  };

  return (
    <>
      <ExpenseGrid
        onCreate={() => setShowCreate(true)}
        onDeactivate={(expense) => setDeactivateExpense(expense)}
      />
      <ExpenseModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={handleSuccess}
      />
      <ExpenseDeactivateDialog
        isOpen={Boolean(deactivateExpense)}
        onClose={() => setDeactivateExpense(null)}
        expense={deactivateExpense}
        onSuccess={handleSuccess}
      />
    </>
  );
}

ExpensesFeature.propTypes = {};
