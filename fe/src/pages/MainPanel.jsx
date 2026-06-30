import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';
import UserMenu from '@/components/UserMenu';
import Button from '@/components/chadcn/Button';
import MenuIcon from '@/components/chadcn/icons/MenuIcon';
import CustomersFeature from '@/features/customers';

const PANEL_TEXT = {
  brand: 'sivi‑design',
  toggleSidebar: 'Toggle sidebar',
  closeSidebar: 'Close sidebar',
  comingSoon: 'Coming soon',
  placeholderDescription: 'This area is reserved for a future module.',
};

const NAV_ITEMS = [
  { id: 'customers', label: 'Customers' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'billing', label: 'Billing' },
];

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

    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {PANEL_TEXT.comingSoon}
        </span>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">{activeItem.label}</h1>
        <p className="mt-2 text-sm text-slate-500">{PANEL_TEXT.placeholderDescription}</p>
      </div>
    );
  };

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-left">
      <header className="flex w-full shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 py-3 shadow-sm sm:px-6">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            className="h-10 w-10 p-0"
            onClick={() => setIsSidebarOpen((o) => !o)}
            aria-label={PANEL_TEXT.toggleSidebar}
          >
            <MenuIcon className="h-5 w-5" />
          </Button>
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

      <div className="relative flex flex-1 overflow-hidden">
        {isSidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 top-[73px] z-20 bg-slate-900/20 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
            aria-label={PANEL_TEXT.closeSidebar}
          />
        )}

        <aside
          className={[
            'fixed inset-y-0 left-0 top-[73px] z-30 overflow-hidden bg-white transition-all duration-200',
            'md:static md:top-0 md:translate-x-0 md:shadow-none',
            isSidebarOpen
              ? 'w-56 translate-x-0 border-r border-slate-100 px-4 py-6 shadow-xl md:shadow-none'
              : 'w-56 -translate-x-full px-4 py-6 md:w-0 md:px-0 md:py-0 md:border-0',
          ].join(' ')}
        >
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeModule === item.id;
              return (
                <Button
                  key={item.id}
                  type="button"
                  variant="ghost"
                  onClick={() => setActiveModule(item.id)}
                  className={`w-full justify-start rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{renderModule()}</main>
      </div>
    </div>
  );
}

MainPanel.propTypes = {
  onLogout: PropTypes.func.isRequired,
};