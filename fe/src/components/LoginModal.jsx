import PropTypes from 'prop-types';
import LoginForm from './LoginForm';
import useLogin from '../hooks/useLogin';
import { useRef, useEffect } from 'react';

export default function LoginModal({ isOpen, onClose }) {
  const mutation = useLogin();
  const firstInputRef = useRef(null);

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
      onClose();
    }
  }, [mutation.isSuccess, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="fixed inset-0 bg-black bg-opacity-60" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md p-6 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Sign in</h2>
        <LoginForm
          onSubmit={handleSubmit}
          isLoading={mutation.isLoading}
          error={mutation.error?.message || mutation.error}
        />

        <div className="mt-4 text-right">
          <Button onClick={onClose} className="px-3 py-1 bg-gray-200 text-gray-800" aria-label="Close sign in">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

LoginModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
};
