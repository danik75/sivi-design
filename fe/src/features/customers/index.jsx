import { useState } from 'react';
import useToast from '@/components/chadcn/useToast';
import CustomerDeleteDialog from '@/features/customers/components/CustomerDeleteDialog';
import CustomerGrid from '@/features/customers/components/CustomerGrid';
import CustomerModal from '@/features/customers/components/CustomerModal';
import CustomerTasksPanel from '@/features/customers/components/CustomerTasksPanel';
import TaskModal from '@/features/tasks/components/TaskModal';

export default function CustomersFeature() {
  const { showToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [deleteCustomer, setDeleteCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editTask, setEditTask] = useState(null);

  const handleSuccess = (message) => {
    showToast(message, 'success');
    setShowCreate(false);
    setEditCustomer(null);
    setDeleteCustomer(null);
  };

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer((prev) => (prev?.id === customer.id ? null : customer));
  };

  return (
    <>
      <CustomerGrid
        onCreate={() => setShowCreate(true)}
        onEdit={(customer) => setEditCustomer(customer)}
        onDelete={(customer) => setDeleteCustomer(customer)}
        selectedCustomerId={selectedCustomer?.id ?? null}
        onSelectCustomer={handleSelectCustomer}
      />

      {selectedCustomer ? (
        <CustomerTasksPanel
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onEditTask={(task) => setEditTask(task)}
        />
      ) : null}

      <TaskModal
        isOpen={Boolean(editTask)}
        onClose={() => setEditTask(null)}
        task={editTask}
        onSuccess={(msg) => {
          handleSuccess(msg);
          setEditTask(null);
        }}
      />

      <CustomerModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        customer={null}
        onSuccess={handleSuccess}
      />

      <CustomerModal
        isOpen={Boolean(editCustomer)}
        onClose={() => setEditCustomer(null)}
        customer={editCustomer}
        onSuccess={handleSuccess}
      />

      <CustomerDeleteDialog
        isOpen={Boolean(deleteCustomer)}
        onClose={() => setDeleteCustomer(null)}
        customer={deleteCustomer}
        onSuccess={handleSuccess}
      />
    </>
  );
}
