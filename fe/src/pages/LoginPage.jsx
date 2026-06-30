import PropTypes from 'prop-types';
import LoginForm from '@/components/LoginForm';
import useLogin from '@/hooks/useLogin';

export default function LoginPage({ onSuccess }) {
  const mutation = useLogin();

  const handleSubmit = ({ username, password }) => {
    mutation.mutate({ username, password });
  };

  if (mutation.isSuccess && typeof onSuccess === 'function') {
    setTimeout(() => onSuccess(), 10);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
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

LoginPage.propTypes = {
  onSuccess: PropTypes.func,
};
