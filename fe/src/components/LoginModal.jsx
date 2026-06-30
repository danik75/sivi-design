import PropTypes from 'prop-types';
import LoginForm from './LoginForm';
import useLogin from '../hooks/useLogin';
import { useRef, useEffect } from 'react';

export default function LoginModal({ isOpen, onLoginSuccess }) {
  const mutation = useLogin();
  const firstInputRef = useRef(null);

    // Reset stale mutation state (e.g. isSuccess from a previous session) each
    // time the modal opens, so logout → re-open does not immediately re-authenticate.
    useEffect(() => {
      if (isOpen) mutation.reset();
      // intentionally omit mutation from deps — mutation.reset is stable
    }, [isOpen]); // eslint-disable-line

  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = ({ username, password }) => {
    mutation.mutate({ username, password });
  };

  useEffect(() => {
    if (mutation.isSuccess) {
      onLoginSuccess();
    }
  }, [mutation.isSuccess, onLoginSuccess]);

  if (!isOpen) return null;

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
  isOpen: PropTypes.bool.isRequired,
  onLoginSuccess: PropTypes.func.isRequired,
};
