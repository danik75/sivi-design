import PropTypes from 'prop-types';
import { useState } from 'react';
import Avatar from './chadcn/Avatar';
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
        className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label={`Logged in as ${username}. Click to open account menu.`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Avatar initials={username} />
        <span className="hidden sm:inline text-sm font-medium text-gray-700">{username}</span>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-44 bg-white border rounded shadow-lg z-50"
          role="menu"
          aria-label="Account menu"
        >
          <div className="px-4 py-2 text-xs text-gray-500 border-b">Signed in as</div>
          <div className="px-4 py-2 text-sm font-medium text-gray-800 border-b truncate">
            {username}
          </div>
          <button
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            role="menuitem"
            onClick={handleLogout}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

UserMenu.propTypes = {
  onLogout: PropTypes.func.isRequired,
};
