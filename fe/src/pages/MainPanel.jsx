import PropTypes from 'prop-types';
import UserMenu from '../components/UserMenu';

export default function MainPanel({ onLogout }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="w-full bg-white border-b border-slate-100 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">S</span>
          </div>
          <span className="text-base font-bold text-slate-800 tracking-tight">sivi‑design</span>
        </div>
        <UserMenu onLogout={onLogout} />
      </header>

      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
          <p className="text-slate-500 mb-8">Welcome to sivi‑design. Your workspace is ready.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: 'Projects', value: '—', icon: '📐' },
              { label: 'Components', value: '—', icon: '⚛️' },
              { label: 'Team members', value: '—', icon: '👥' },
            ].map(({ label, value, icon }) => (
              <div
                key={label}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-2"
              >
                <span className="text-2xl">{icon}</span>
                <span className="text-2xl font-bold text-slate-900">{value}</span>
                <span className="text-sm text-slate-400">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

MainPanel.propTypes = {
  onLogout: PropTypes.func.isRequired,
};
