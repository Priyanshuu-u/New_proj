import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const ToastContext = createContext(null);

function ToastItem({ toast }) {
  const styles =
    toast.type === "error"
      ? "border-red-300 bg-red-50 text-red-800"
      : toast.type === "success"
        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
        : "border-sky-300 bg-sky-50 text-sky-800";

  return (
    <div
      className={`min-w-[260px] rounded-xl border px-3 py-2 shadow ${styles}`}
    >
      <p className="text-sm font-semibold">{toast.title}</p>
      {toast.message ? (
        <p className="text-xs opacity-90">{toast.message}</p>
      ) : null}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const pushToast = useCallback((title, message = "", type = "info") => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
