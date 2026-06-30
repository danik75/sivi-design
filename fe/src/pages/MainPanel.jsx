import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';
import UserMenu from '@/components/UserMenu';
import Button from '@/components/chadcn/Button';
import MenuIcon from '@/components/chadcn/icons/MenuIcon';
import ChevronDownIcon from '@/components/chadcn/icons/ChevronDownIcon';
import CustomersFeature from '@/features/customers';

const PANEL_TEXT = {
  brand: 'sivi‑design',
  toggleNavigation: 'Toggle navigation',
  collapseSidebar: 'Collapse sidebar',
  expandSidebar: 'Expand sidebar',
  comingSoon: 'Coming soon',
  placeholderDescription: 'This area is reserved for a future module.',
};

// Icon per nav item
const NAV_ICONS = {
  customers: (
    <svg
      className="h-4 w-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
  tasks: (
    <svg
      className="h-4 w-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    </svg>
  ),
  billing: (
    <svg
      className="h-4 w-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
  ),
};

const NAV_ITEMS = [
  { id: 'customers', label: 'Customers', disabled: false },
  { id: 'tasks', label: 'Tasks', disabled: true },
  { id: 'billing', label: 'Billing', disabled: true },
];

export default function MainPanel({ onLogout }) {
  const [activeModule, setActiveModule] = useState('customers');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  // Desktop: collapsed = icon-only rail
  const [collapsed, setCollapsed] = useState(true);

  const activeItem = useMemo(
    () => NAV_ITEMS.find((item) => item.id === activeModule) ?? NAV_ITEMS[0],
    [activeModule]
  );

  const navigate = (id) => {
    setActiveModule(id);
    setMobileSidebarOpen(false);
  };

  const renderModule = () => {
    if (activeModule === 'customers') return <CustomersFeature />;
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

  const sidebarNav = (mobile = false) => (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive = activeModule === item.id;
        const showLabel = mobile || !collapsed;
        return (
          <Button
            key={item.id}
            variant="ghost"
            disabled={item.disabled}
            onClick={() => !item.disabled && navigate(item.id)}
            title={collapsed && !mobile ? item.label : undefined}
            className={`w-full gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all
              ${showLabel ? 'justify-start' : 'justify-center'}
              ${
                isActive
                  ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                  : item.disabled
                    ? 'cursor-not-allowed text-slate-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
          >
            {NAV_ICONS[item.id]}
            {showLabel && <span>{item.label}</span>}
            {showLabel && item.disabled && (
              <span
                className={`ml-auto text-xs ${isActive ? 'text-indigo-200' : 'text-slate-300'}`}
              >
                soon
              </span>
            )}
          </Button>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Top bar */}
      <header className="flex w-full items-center justify-between border-b border-slate-100 bg-white px-4 py-3 shadow-sm sm:px-5">
        <div className="flex items-center gap-2.5">
          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            className="h-9 w-9 p-0 md:hidden"
            onClick={() => setMobileSidebarOpen((o) => !o)}
            aria-label={PANEL_TEXT.toggleNavigation}
          >
            <MenuIcon className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
              <span className="text-xs font-bold text-white">S</span>
            </div>
            {/* Hide brand text when desktop sidebar is collapsed to save space */}
            {!collapsed && (
              <span className="text-base font-bold tracking-tight text-slate-800">
                {PANEL_TEXT.brand}
              </span>
            )}
          </div>
        </div>
        <UserMenu onLogout={onLogout} />
      </header>

      <div className="relative flex flex-1 overflow-hidden">
        {/* Mobile overlay */}
        {mobileSidebarOpen && (
          <Button
            variant="ghost"
            className="fixed inset-0 top-[57px] z-20 h-auto w-full rounded-none bg-slate-900/30 p-0 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label={PANEL_TEXT.toggleNavigation}
          />
        )}

        {/* Desktop sidebar */}
        <aside
          className={`hidden md:flex flex-col border-r border-slate-100 bg-white transition-all duration-200
            ${collapsed ? 'w-16' : 'w-56'}`}
        >
          <div className={`flex flex-col flex-1 px-2 py-4 gap-1`}>{sidebarNav()}</div>

          {/* Collapse / expand toggle at the bottom */}
          <div className="border-t border-slate-100 px-2 py-3">
            <Button
              variant="ghost"
              className={`w-full gap-2 rounded-xl px-3 py-2 text-xs text-slate-400 hover:text-slate-600
                ${collapsed ? 'justify-center' : 'justify-start'}`}
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? PANEL_TEXT.expandSidebar : PANEL_TEXT.collapseSidebar}
              title={collapsed ? PANEL_TEXT.expandSidebar : PANEL_TEXT.collapseSidebar}
            >
              <ChevronDownIcon
                className={`h-4 w-4 shrink-0 transition-transform duration-200 ${collapsed ? '-rotate-90' : 'rotate-90'}`}
              />
              {!collapsed && <span>Collapse</span>}
            </Button>
          </div>
        </aside>

        {/* Mobile drawer sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 top-[57px] z-30 w-56 flex flex-col border-r border-slate-100 bg-white px-2 py-4 shadow-xl transition-transform duration-200 md:hidden
            ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          {sidebarNav(true)}
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-3 py-4">{renderModule()}</main>
      </div>
    </div>
  );
}

MainPanel.propTypes = {
  onLogout: PropTypes.func.isRequired,
};
