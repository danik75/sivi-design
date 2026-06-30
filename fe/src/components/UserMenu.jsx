import PropTypes from 'prop-types';
import { useState } from 'react';
import Avatar from '@/components/chadcn/Avatar';
import Button from '@/components/chadcn/Button';
import ChevronDownIcon from '@/components/chadcn/icons/ChevronDownIcon';
import LogoutIcon from '@/components/chadcn/icons/LogoutIcon';
import useAuth from '@/hooks/useAuth';

export default function UserMenu({ onLogout }) {
  const { username, logout } = useAuth();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    logout();
    onLogout();
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen((current) => !current)}
        className="rounded-full px-2 py-1 hover:bg-slate-100 focus:ring-indigo-400"
        aria-label={`Logged in as ${username}. Open account menu.`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Avatar initials={username} />
        <span className="hidden text-sm font-medium text-slate-700 sm:inline">{username}</span>
        <ChevronDownIcon className="h-4 w-4 text-slate-400" />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl"
            role="menu"
            aria-label="Account menu"
          >
            <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Signed in as
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">{username}</p>
            </div>
            <div className="p-1.5">
              <Button
                type="button"
                variant="danger"
                className="w-full justify-start px-3 py-2 text-sm"
                role="menuitem"
                onClick={handleLogout}
              >
                <LogoutIcon />
                Sign out
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

UserMenu.propTypes = {
  onLogout: PropTypes.func.isRequired,
};
