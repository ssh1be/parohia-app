"use client";

import { AnimatePresence, motion } from "motion/react";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Icon } from "../Icon";

type ToastTone = "success" | "error" | "info";

interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

const ToastContext = createContext<(message: string, tone?: ToastTone) => void>(() => {});

export const useToast = () => useContext(ToastContext);

const TONE_ICON = {
  success: { name: "checkmark-circle" as const, className: "text-emerald-500" },
  error: { name: "alert-circle" as const, className: "text-red-500" },
  info: { name: "information-circle-outline" as const, className: "text-blue-500" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const push = useCallback((message: string, tone: ToastTone = "success") => {
    const id = ++nextId.current;
    setToasts((prev) => [...prev, { id, tone, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), tone === "error" ? 6000 : 3500);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-6 right-6 z-[120] flex w-[360px] flex-col gap-2">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-zinc-200/80 bg-white px-4 py-3 shadow-lg dark:border-white/10 dark:bg-zinc-900"
            >
              <Icon name={TONE_ICON[toast.tone].name} size={18} className={`mt-0.5 ${TONE_ICON[toast.tone].className}`} />
              <p className="text-[14px] leading-5 text-zinc-700 dark:text-zinc-200">{toast.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
