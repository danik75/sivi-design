import PropTypes from 'prop-types';
import { useState, useRef } from 'react';
import Input from './chadcn/Input';
import Button from './chadcn/Button';
import Form from './chadcn/Form';
import FormField from './chadcn/FormField';

export default function LoginForm({ onSubmit, isLoading, error }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const userRef = useRef(null);

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({ username, password });
  }

  return (
    <Form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Sign in</h2>

      <FormField label="Username">
        <Input
          ref={userRef}
          className="mt-1"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </FormField>

      <FormField label="Password">
        <Input
          type="password"
          className="mt-1"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </FormField>

      {error && <div className="text-red-600 mb-3">{String(error)}</div>}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign in'}
      </Button>
    </Form>
  );
}

LoginForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.any,
};
