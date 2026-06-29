import { useMutation } from '@tanstack/react-query';
import { loginApi } from '../services/api';

export default function useLogin() {
  return useMutation(loginApi, {
    onSuccess(data) {
      const token = data?.access_token || data?.token || data;
      try {
        const stored = typeof token === 'string' ? token : JSON.stringify(token);
        localStorage.setItem('sivi_token', stored);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to persist token', e);
      }
      return token;
    },
    onError(err) {
      // eslint-disable-next-line no-console
      console.error('Login error', err);
    },
  });
}
