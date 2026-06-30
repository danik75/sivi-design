import PropTypes from 'prop-types';
import { useState } from 'react';
import UserMenu from '@/components/UserMenu';
import Button from '@/components/chadcn/Button';
import MenuIcon from '@/components/chadcn/icons/MenuIcon';
import ChevronDownIcon from '@/components/chadcn/icons/ChevronDownIcon';
import CustomersFeature from '@/features/customers';

const NAV_ITEMS = [
  {
    id: 'customers',
    label: 'Customers',
    icon: (
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
    ready: true,
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: (
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
    ready: false,
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: (
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
    ready: false,
  },
];

function PlaceholderPanel({ label }) {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-3xl font-bold text-slate-800">{label}</h1>
      <p className="mt-2 text-sm text-slate-400">This module is coming soon.</p>
    </div>
  );
}
PlaceholderPanel.propTypes = { label: PropTypes.string.isRequired };

export default function MainPanel({ onLogout }) {
  const [activeId, setActiveId] = useState('customers');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeItem = NAV_ITEMS.find((n) => n.id === activeId) ?? NAV_ITEMS[0];

  const renderContent = () => {
    if (activeItem.id === 'customers') return <CustomersFeature />;
    return <PlaceholderPanel label={activeItem.label} />;
  };

  const NavItem = ({ item }) => {
    const isActive = activeId === item.id;
    return (
      <Button
        variant="nav"
        onClick={() => {
          setActiveId(item.id);
          setMobileOpen(false);
        }}
        title={collapsed ? item.label : undefined}
        className={`w-full gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all
          ${collapsed ? 'justify-center' : 'justify-start'}
          ${
            isActive
              ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-500'
              : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
          }`}
      >
        {item.icon}
        {!collapsed && <span>{item.label}</span>}
        {!collapsed && !item.ready && (
          <span
            className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${isActive ? 'bg-indigo-500 text-indigo-100' : 'bg-slate-100 text-slate-400'}`}
          >
            soon
          </span>
        )}
      </Button>
    );
  };
  NavItem.propTypes = {
    item: PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.node,
      ready: PropTypes.bool,
    }).isRequired,
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-50">
      {/* Top bar */}
      <header className="flex w-full shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            className="h-9 w-9 p-0 md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle navigation"
          >
            <MenuIcon className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
              <span className="text-xs font-bold text-white">S</span>
            </div>
            {!collapsed && (
              <span className="text-sm font-bold tracking-tight text-slate-800">sivi‑design</span>
            )}
          </div>
        </div>
        <UserMenu onLogout={onLogout} />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 top-[57px] z-20 bg-slate-900/30 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Desktop sidebar */}
        <aside
          className={`hidden md:flex flex-col shrink-0 border-r border-slate-100 bg-white transition-all duration-200 ${collapsed ? 'w-14' : 'w-52'}`}
        >
          <nav className="flex flex-1 flex-col gap-1 px-2 py-4">
            {NAV_ITEMS.map((item) => (
              // eslint-disable-line react/prop-types
              <NavItem key={item.id} item={item} /> // eslint-disable-line react/prop-types
            ))}
          </nav>
          {/* Collapse toggle */}
          <div className="border-t border-slate-100 px-2 py-2">
            <Button
              variant="ghost"
              className={`w-full rounded-xl px-3 py-2 text-xs text-slate-400 hover:text-slate-600 ${collapsed ? 'justify-center' : 'justify-start gap-2'}`}
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronDownIcon
                className={`h-4 w-4 shrink-0 transition-transform duration-200 ${collapsed ? '-rotate-90' : 'rotate-90'}`}
              />
              {!collapsed && <span>Collapse</span>}
            </Button>
          </div>
        </aside>

        {/* Mobile drawer */}
        <aside
          className={`fixed inset-y-0 left-0 top-[57px] z-30 flex w-52 flex-col border-r border-slate-100 bg-white px-2 py-4 shadow-xl transition-transform duration-200 md:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              // eslint-disable-line react/prop-types
              <NavItem key={item.id} item={item} /> // eslint-disable-line react/prop-types
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 py-4">{renderContent()}</main>
      </div>
    </div>
  );
}

MainPanel.propTypes = { onLogout: PropTypes.func.isRequired };
