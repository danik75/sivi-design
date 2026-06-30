import PropTypes from 'prop-types';
import UserMenu from '../components/UserMenu';

export default function MainPanel({ onLogout }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* top bar */}
      <header className="w-full bg-white shadow-sm px-6 py-3 flex items-center justify-between">
        <span className="text-lg font-bold text-blue-600">sivi-design</span>
        <UserMenu onLogout={onLogout} />
      </header>

      {/* main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-4xl p-6 bg-white rounded shadow">
          <h1 className="text-2xl font-bold mb-4">Main App Panel</h1>
          <p className="text-gray-700">Welcome — you are logged in.</p>
        </div>
      </main>
    </div>
  );
}

MainPanel.propTypes = {
  onLogout: PropTypes.func.isRequired,
};
