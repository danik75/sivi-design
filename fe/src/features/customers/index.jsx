import { useState } from 'react';
import useToast from '@/components/chadcn/useToast';
import CustomerDeleteDialog from '@/features/customers/components/CustomerDeleteDialog';
import CustomerGrid from '@/features/customers/components/CustomerGrid';
import CustomerModal from '@/features/customers/components/CustomerModal';

export default function CustomersFeature() {
  const { showToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [deleteCustomer, setDeleteCustomer] = useState(null);

  const handleSuccess = (message) => {
    showToast(message, 'success');
    setShowCreate(false);
    setEditCustomer(null);
    setDeleteCustomer(null);
  };

  return (
    <>
      <CustomerGrid
        onCreate={() => setShowCreate(true)}
        onEdit={(customer) => setEditCustomer(customer)}
        onDelete={(customer) => setDeleteCustomer(customer)}
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
