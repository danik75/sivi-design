import PropTypes from 'prop-types';
import { createContext, createElement, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext({
  toasts: [],
  showToast: () => null,
  dismissToast: () => null,
});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((current) => [...current, { id, message, type }]);
    return id;
  }, []);

  const value = useMemo(
    () => ({ toasts, showToast, dismissToast }),
    [dismissToast, showToast, toasts]
  );

  return createElement(ToastContext.Provider, { value }, children);
}

export default function useToast() {
  return useContext(ToastContext);
}

ToastProvider.propTypes = {
  children: PropTypes.node,
};

export { ToastContext };
