import PropTypes from 'prop-types';
import LoginForm from './LoginForm';
import useLogin from '../hooks/useLogin';
import { useRef, useEffect } from 'react';

export default function LoginModal({ onLoginSuccess }) {
  const mutation = useLogin();
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (firstInputRef.current) firstInputRef.current.focus();
  }, []);

  useEffect(() => {
    if (mutation.isSuccess) onLoginSuccess();
  }, [mutation.isSuccess, onLoginSuccess]);

  const handleSubmit = ({ username, password }) => {
    mutation.mutate({ username, password });
  };

  return (
    /* full-viewport overlay */
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sign in"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* blurred backdrop */}
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" aria-hidden="true" />

      {/* card */}
      <div className="relative z-10 flex w-full max-w-3xl overflow-hidden rounded-2xl shadow-2xl">
        {/* left — branding panel */}
        <div className="hidden md:flex flex-col justify-between w-1/2 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-10 text-white">
          <div>
            <div className="text-2xl font-extrabold tracking-tight mb-1">sivi‑design</div>
            <div className="text-indigo-200 text-sm">Collaborative design platform</div>
          </div>

          <div className="space-y-4">
            {[
              { icon: '✦', text: 'Beautiful, component-first UI' },
              { icon: '⚡', text: 'Fast, reactive data layer' },
              { icon: '🔒', text: 'Secure, token-based auth' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-indigo-100">
                <span className="text-lg">{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-indigo-300">© {new Date().getFullYear()} sivi‑design</p>
        </div>

        {/* right — form panel */}
        <div className="flex flex-col justify-center w-full md:w-1/2 bg-white p-10">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-500">Sign in to your account to continue.</p>
          </div>

          <LoginForm
            onSubmit={handleSubmit}
            isLoading={mutation.isLoading || mutation.isPending}
            error={mutation.error?.response?.data?.message || mutation.error?.message}
          />
        </div>
      </div>
    </div>
  );
}

LoginModal.propTypes = {
  onLoginSuccess: PropTypes.func.isRequired,
};
