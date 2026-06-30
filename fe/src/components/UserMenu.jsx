import PropTypes from 'prop-types';
import { useState } from 'react';
import Avatar from './chadcn/Avatar';
import Button from './chadcn/Button';
import useAuth from '../hooks/useAuth';

export default function UserMenu({ onLogout }) {
  const { username, logout } = useAuth();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    logout();
    onLogout();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-full px-2 py-1 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
        aria-label={`Logged in as ${username}. Open account menu.`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Avatar initials={username} />
        <span className="hidden sm:inline text-sm font-medium text-slate-700">{username}</span>
        <svg
          className="w-4 h-4 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            className="absolute right-0 mt-2 w-52 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden"
            role="menu"
            aria-label="Account menu"
          >
            <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-slate-100">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                Signed in as
              </p>
              <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">{username}</p>
            </div>
            <div className="p-1.5">
              <Button
                variant="danger"
                className="w-full justify-start px-3 py-2 text-sm"
                role="menuitem"
                onClick={handleLogout}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
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
