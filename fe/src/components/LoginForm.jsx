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
    <Form onSubmit={handleSubmit} className="w-full space-y-5">
      <FormField label="Username">
        <Input
          ref={userRef}
          autoComplete="username"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </FormField>

      <FormField label="Password">
        <Input
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </FormField>

      {error && (
        <p className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-600">
          {String(error)}
        </p>
      )}

      <Button type="submit" className="w-full py-3" disabled={isLoading}>
        {isLoading ? 'Signing in…' : 'Sign in →'}
      </Button>
    </Form>
  );
}

LoginForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.any,
};
