import React, { createContext, useContext, useState, useCallback, useId } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (title: string, message?: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (title: string, message?: string, type: ToastType = 'info', duration = 5000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: ToastItem = { id, title, message, type, duration };

      setToasts((prev) => [...prev.slice(-4), newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      {/* Toast Render Stack */}
      <div
        id="toast-viewport"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            role="alert"
            className="pointer-events-auto flex items-start gap-3 p-4 rounded-lg bg-slate-900/95 border shadow-2xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 duration-200"
            style={{
              borderColor:
                toast.type === 'success'
                  ? '#059669'
                  : toast.type === 'error'
                  ? '#dc2626'
                  : toast.type === 'warning'
                  ? '#d97706'
                  : '#2563eb',
            }}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-100">{toast.title}</h4>
              {toast.message && (
                <p className="mt-1 text-xs text-slate-300 leading-relaxed break-words">
                  {toast.message}
                </p>
              )}
            </div>

            <button
              id={`toast-close-${toast.id}`}
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-slate-400 hover:text-slate-100 p-1 rounded transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
