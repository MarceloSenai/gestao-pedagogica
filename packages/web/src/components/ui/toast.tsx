"use client";

import { useCallback, useEffect, useState } from "react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
}

let addToastFn: ((message: string, type: Toast["type"]) => void) | null = null;

export function toast(message: string, type: Toast["type"] = "info") {
  addToastFn?.(message, type);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast["type"]) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => {
      addToastFn = null;
    };
  }, [addToast]);

  const typeStyles: Record<Toast["type"], string> = {
    success: "bg-green-600 text-white",
    error: "bg-red-600 text-white",
    warning: "bg-yellow-500 text-white",
    info: "bg-[var(--color-surface-dark)] text-white",
  };

  const typeIcons: Record<Toast["type"], string> = {
    success: "\u2713",
    error: "\u2715",
    warning: "\u26A0",
    info: "\u2139",
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg text-sm font-medium ${typeStyles[t.type]}`}
          style={{ animation: "slideIn 0.3s ease-out" }}
        >
          <span className="text-base">{typeIcons[t.type]}</span>
          <span>{t.message}</span>
          <button
            type="button"
            onClick={() =>
              setToasts((prev) => prev.filter((x) => x.id !== t.id))
            }
            className="ml-2 opacity-70 hover:opacity-100 cursor-pointer"
          >
            \u00D7
          </button>
        </div>
      ))}
    </div>
  );
}
