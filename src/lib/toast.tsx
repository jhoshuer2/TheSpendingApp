import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Toast } from "../design-system/Toast";

interface ToastApi {
  /** Show a short message, with an optional Undo. It survives navigating to another screen. */
  show: (message: string, undo?: () => void) => void;
}

const Ctx = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [t, setT] = useState<{ message: string; undo?: () => void; n: number } | null>(null);
  const show = useCallback((message: string, undo?: () => void) => setT((cur) => ({ message, undo, n: (cur?.n ?? 0) + 1 })), []);
  const close = useCallback(() => setT(null), []);
  const api = useMemo(() => ({ show }), [show]);
  return (
    <Ctx.Provider value={api}>
      {children}
      {t && <Toast key={t.n} message={t.message} actionLabel={t.undo ? "Undo" : undefined} onAction={t.undo} onClose={close} />}
    </Ctx.Provider>
  );
}

export function useToast(): ToastApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useToast must be used inside ToastProvider");
  return v;
}
