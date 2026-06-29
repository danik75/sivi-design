import PropTypes from 'prop-types';
import { useState } from 'react';

export default function LoginForm({ onSubmit, isLoading, error }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({ username, password });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Sign in</h2>

      <label className="block mb-3">
        <span className="text-sm text-gray-600">Username</span>
        <input
          className="mt-1 block w-full p-2 border rounded"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </label>

      <label className="block mb-4">
        <span className="text-sm text-gray-600">Password</span>
        <input
          type="password"
          className="mt-1 block w-full p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>

      {error && <div className="text-red-600 mb-3">{String(error)}</div>}

      <button
        type="submit"
        className="w-full py-2 px-4 bg-blue-600 text-white rounded disabled:opacity-50"
        disabled={isLoading}
      >
        {isLoading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}

LoginForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.any,
};
