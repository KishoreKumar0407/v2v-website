import React, { createContext, useCallback, useContext, useState } from 'react';

type ToastType = 'info' | 'success' | 'error' | 'warning';
type Toast = { id: number; message: string; type?: ToastType };

const ToastContext = createContext<{
    showToast: (message: string, type?: ToastType) => void;
}>({ showToast: () => {} });

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Date.now() + Math.floor(Math.random() * 1000);
        setToasts(t => [...t, { id, message, type }]);
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 9999 }}>
                {toasts.map(t => (
                    <div key={t.id} style={{ marginBottom: 8, minWidth: 200, padding: '10px 14px', borderRadius: 8, color: '#fff', boxShadow: '0 6px 18px rgba(0,0,0,0.4)', background: t.type === 'success' ? '#16a34a' : t.type === 'error' ? '#dc2626' : t.type === 'warning' ? '#d97706' : '#0ea5e9' }}>
                        {t.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    return useContext(ToastContext);
};

export default ToastProvider;
