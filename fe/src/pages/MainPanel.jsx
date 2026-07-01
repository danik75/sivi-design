import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';
import UserMenu from '@/components/UserMenu';
import ChevronDownIcon from '@/components/chadcn/icons/ChevronDownIcon';
import ClipboardIcon from '@/components/chadcn/icons/ClipboardIcon';
import CreditCardIcon from '@/components/chadcn/icons/CreditCardIcon';
import DocumentTextIcon from '@/components/chadcn/icons/DocumentTextIcon';
import FileInvoiceIcon from '@/components/chadcn/icons/FileInvoiceIcon';
import ReceiptIcon from '@/components/chadcn/icons/ReceiptIcon';
import UsersIcon from '@/components/chadcn/icons/UsersIcon';
import ContractsFeature from '@/features/contracts';
import CustomersFeature from '@/features/customers';
import ExpensesFeature from '@/features/expenses';
import InvoicesFeature from '@/features/invoices';
import TasksFeature from '@/features/tasks';

const PANEL_TEXT = {
  brand: 'sivi‑design',
  toggleSidebar: 'Toggle sidebar',
  closeSidebar: 'Close sidebar',
  comingSoon: 'Coming soon',
  placeholderDescription: 'This module is not yet implemented.',
};

const NAV_ITEMS = [
  { id: 'customers', label: 'Customers', Icon: UsersIcon },
  { id: 'tasks', label: 'Tasks', Icon: ClipboardIcon },
  { id: 'contracts', label: 'Contracts', Icon: DocumentTextIcon },
  { id: 'expenses', label: 'Expenses', Icon: ReceiptIcon },
  { id: 'invoices', label: 'Invoices', Icon: FileInvoiceIcon },
  { id: 'billing', label: 'Billing', Icon: CreditCardIcon },
];

function SidebarNav({ activeModule, onSelect, collapsed }) {
  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map(({ id, label, Icon }) => {
        const isActive = activeModule === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            title={collapsed ? label : undefined}
            className={`flex items-center rounded-xl text-sm font-medium transition-colors focus:outline-none ${
              collapsed ? 'mx-auto h-10 w-10 justify-center' : 'w-full gap-3 px-3 py-2.5'
            } ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && label}
          </button>
        );
      })}
    </nav>
  );
}

SidebarNav.propTypes = {
  activeModule: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  collapsed: PropTypes.bool,
};

export default function MainPanel({ onLogout }) {
  const [activeModule, setActiveModule] = useState('customers');
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 768
  );

  const activeItem = useMemo(
    () => NAV_ITEMS.find((item) => item.id === activeModule) ?? NAV_ITEMS[0],
    [activeModule]
  );

  const renderModule = () => {
    if (activeModule === 'customers') {
      return <CustomersFeature />;
    }

    if (activeModule === 'tasks') {
      return <TasksFeature />;
    }

    if (activeModule === 'contracts') {
      return <ContractsFeature />;
    }

    if (activeModule === 'expenses') {
      return <ExpensesFeature />;
    }

    if (activeModule === 'invoices') {
      return <InvoicesFeature />;
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{activeItem.label}</h1>
          <p className="mt-2 text-sm text-slate-500">{PANEL_TEXT.placeholderDescription}</p>
        </div>
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-24 shadow-sm">
          <div className="text-center">
            <activeItem.Icon className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-4 text-sm font-medium text-slate-400">{PANEL_TEXT.comingSoon}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full flex-col bg-slate-50">
      <header className="flex w-full shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 py-3 shadow-sm sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
              <span className="text-xs font-bold text-white">S</span>
            </div>
            <span className="text-base font-bold tracking-tight text-slate-800">
              {PANEL_TEXT.brand}
            </span>
          </div>
        </div>
        <UserMenu onLogout={onLogout} />
      </header>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {isSidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 z-20 bg-slate-900/20 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
            aria-label={PANEL_TEXT.closeSidebar}
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-30 w-56 shrink-0 border-r border-slate-100 bg-white px-3 py-4 shadow-xl transition-transform duration-200 md:hidden ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm hover:bg-slate-50"
              aria-label={PANEL_TEXT.closeSidebar}
            >
              <ChevronDownIcon className="h-3 w-3 rotate-90" />
            </button>
          </div>
          <SidebarNav activeModule={activeModule} onSelect={setActiveModule} />
        </aside>

        {!isSidebarOpen && (
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="fixed left-0 top-1/2 z-30 flex h-10 w-5 -translate-y-1/2 items-center justify-center rounded-r-lg border border-l-0 border-slate-200 bg-white shadow-sm hover:bg-slate-50 md:hidden"
            aria-label={PANEL_TEXT.toggleSidebar}
          >
            <ChevronDownIcon className="h-3 w-3 -rotate-90" />
          </button>
        )}

        <div
          className={`relative hidden shrink-0 border-r border-slate-100 bg-white transition-all duration-200 md:block ${
            isSidebarOpen ? 'w-56' : 'w-14'
          }`}
        >
          <div className="px-2 py-3">
            <SidebarNav
              activeModule={activeModule}
              onSelect={setActiveModule}
              collapsed={!isSidebarOpen}
            />
          </div>

          <button
            type="button"
            onClick={() => setIsSidebarOpen((o) => !o)}
            className="absolute right-0 top-5 z-40 flex h-6 w-6 translate-x-1/2 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md hover:bg-slate-50"
            aria-label={isSidebarOpen ? PANEL_TEXT.closeSidebar : PANEL_TEXT.toggleSidebar}
          >
            <ChevronDownIcon
              className={`h-3 w-3 transition-transform duration-200 ${isSidebarOpen ? 'rotate-90' : '-rotate-90'}`}
            />
          </button>
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{renderModule()}</main>
      </div>
    </div>
  );
}

MainPanel.propTypes = {
  onLogout: PropTypes.func.isRequired,
};
