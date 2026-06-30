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
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* full-screen backdrop — blocks all background interaction */}
      <div className="fixed inset-0 bg-black bg-opacity-60" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md p-6 bg-white rounded shadow">
        <LoginForm
          onSubmit={handleSubmit}
          isLoading={mutation.isLoading || mutation.isPending}
          error={mutation.error?.response?.data?.message || mutation.error?.message}
        />
      </div>
    </div>
  );
}

LoginModal.propTypes = {
  onLoginSuccess: PropTypes.func.isRequired,
};
