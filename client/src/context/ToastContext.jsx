import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const notify = useCallback(({ title, message, type = 'info', duration = 4500 }) => {
    const id = (counter.current += 1);
    setToasts((t) => [...t, { id, title, message, type }]);
    if (duration) setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const value = useMemo(() => ({
    notify,
    success: (title, message) => notify({ title, message, type: 'success' }),
    error: (title, message) => notify({ title, message, type: 'error', duration: 7000 }),
  }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`} onClick={() => dismiss(t.id)}>
            {t.title && <strong>{t.title}</strong>}
            {t.message && <span className="small">{t.message}</span>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
