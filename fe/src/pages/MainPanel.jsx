import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';
import UserMenu from '../components/UserMenu';
import CustomersFeature from '../features/customers';

const PANEL_TEXT = {
  brand: 'sivi‑design',
  toggleNavigation: 'Toggle navigation',
  comingSoon: 'Coming soon',
  placeholderDescription: 'This area is reserved for a future module.',
};

const NAV_ITEMS = [
  { id: 'customers', label: 'Customers', disabled: false },
  { id: 'tasks', label: 'Tasks', disabled: true },
  { id: 'billing', label: 'Billing', disabled: true },
];

export default function MainPanel({ onLogout }) {
  const [activeModule, setActiveModule] = useState('customers');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    <div className="flex min-h-screen flex-col bg-slate-50 text-left">
      <header className="flex w-full items-center justify-between border-b border-slate-100 bg-white px-4 py-3 shadow-sm sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSidebarOpen((current) => !current)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-200 md:hidden"
            aria-label={PANEL_TEXT.toggleNavigation}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
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
        {isSidebarOpen ? (
          <button
            type="button"
            className="fixed inset-0 top-[73px] z-20 bg-slate-900/20 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
            aria-label={PANEL_TEXT.toggleNavigation}
          />
        ) : null}

        <aside
          className={`fixed inset-y-0 left-0 top-[73px] z-30 w-56 border-r border-slate-100 bg-white px-4 py-6 shadow-xl transition-transform duration-200 md:static md:top-0 md:translate-x-0 md:shadow-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <nav className="space-y-2">
            {NAV_ITEMS.map((item) => {
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.disabled) {
                      return;
                    }
                    setActiveModule(item.id);
                    setIsSidebarOpen(false);
                  }}
                  disabled={item.disabled}
                  className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : item.disabled
                        ? 'cursor-not-allowed text-slate-300'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.disabled ? (
                    <span className={`text-xs ${isActive ? 'text-indigo-100' : 'text-slate-300'}`}>
                      •
                    </span>
                  ) : null}
                </button>
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
