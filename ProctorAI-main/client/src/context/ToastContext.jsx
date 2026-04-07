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
      ? "bg-red-600 text-white"
      : toast.type === "success"
        ? "bg-emerald-600 text-white"
        : "bg-slate-800 text-white";

  return (
    <div
      className={`min-w-[280px] max-w-sm rounded-xl px-4 py-3 shadow-lg ${styles}`}
      style={{ animation: "slideDown 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
    >
      <p className="text-sm font-semibold leading-snug">{toast.title}</p>
      {toast.message ? (
        <p className="text-xs opacity-80 mt-0.5">{toast.message}</p>
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
      <div className="pointer-events-none fixed right-4 bottom-4 z-[100] flex flex-col gap-2">
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
