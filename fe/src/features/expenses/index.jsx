import { useState } from 'react';
import useToast from '@/components/chadcn/useToast';
import ExpenseDeactivateDialog from '@/features/expenses/components/ExpenseDeactivateDialog';
import ExpenseGrid from '@/features/expenses/components/ExpenseGrid';
import ExpenseModal from '@/features/expenses/components/ExpenseModal';
import SubscriptionsPanel from '@/features/expenses/components/SubscriptionsPanel';

const TABS = [
  ['expenses', 'Expenses'],
  ['subscriptions', 'Subscriptions'],
];

export default function ExpensesFeature() {
  const { showToast } = useToast();
  const [tab, setTab] = useState('expenses');
  const [showCreate, setShowCreate] = useState(false);
  const [deactivateExpense, setDeactivateExpense] = useState(null);

  const handleSuccess = (message) => {
    showToast(message, 'success');
    setShowCreate(false);
    setDeactivateExpense(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex w-fit gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'expenses' ? (
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
      ) : (
        <SubscriptionsPanel />
      )}
    </div>
  );
}

ExpensesFeature.propTypes = {};
