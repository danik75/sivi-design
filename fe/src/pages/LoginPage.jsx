import LoginForm from '../components/LoginForm';
import useLogin from '../hooks/useLogin';

export default function LoginPage({ onSuccess }) {
  const mutation = useLogin();

  const handleSubmit = ({ username, password }) => {
    mutation.mutate({ username, password });
  };

  // call onSuccess when login succeeds
  if (mutation.isSuccess && typeof onSuccess === 'function') {
    // slight delay to allow UI update
    setTimeout(() => onSuccess(), 10);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <LoginForm
            onSubmit={handleSubmit}
            isLoading={mutation.isLoading}
            error={mutation.error?.message || mutation.error}
          />

          {mutation.isSuccess && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <strong>Logged in — token stored in localStorage.</strong>
            </div>
          )}

          {mutation.isError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
              {String(mutation.error?.message || mutation.error)}
            </div>
          )}
        </div>

        <div className="hidden md:block p-6 bg-white rounded shadow">
          <h3 className="text-lg font-medium mb-2">About</h3>
          <p className="text-sm text-gray-600">
            Simple local login page for development. Not for production.
          </p>
        </div>
      </div>
    </div>
  );
}
