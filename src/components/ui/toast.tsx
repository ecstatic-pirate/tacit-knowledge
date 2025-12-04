'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Check, X, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-0 right-0 z-[2000] flex flex-col gap-2 p-4 max-w-[420px] w-full sm:bottom-0 sm:right-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "group relative flex items-center gap-3 overflow-hidden rounded-md border bg-background p-4 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-bottom-full",
              "border-border text-foreground"
            )}
          >
            <div className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
              toast.type === 'success' && "bg-emerald-50 text-emerald-600 border-emerald-100",
              toast.type === 'error' && "bg-red-50 text-red-600 border-red-100",
              toast.type === 'warning' && "bg-amber-50 text-amber-600 border-amber-100",
              toast.type === 'info' && "bg-blue-50 text-blue-600 border-blue-100"
            )}>
               {toast.type === 'success' && <Check className="h-4 w-4" />}
               {toast.type === 'error' && <X className="h-4 w-4" />}
               {toast.type === 'warning' && <AlertTriangle className="h-4 w-4" />}
               {toast.type === 'info' && <Info className="h-4 w-4" />}
            </div>
            
            <p className="text-sm font-medium">
              {toast.message}
            </p>
            
            <button
              onClick={() => removeToast(toast.id)}
              className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
