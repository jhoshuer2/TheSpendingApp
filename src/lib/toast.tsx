import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Reward, type RewardProps } from "../design-system/Reward";
import { Toast } from "../design-system/Toast";

interface ToastApi {
  /** Show a short message, with an optional Undo. It survives navigating to another screen. */
  show: (message: string, undo?: () => void) => void;
  /** A sale landing: the bigger, warmer version of show(), with Undo. Replaces whatever is showing. */
  celebrate: (r: Omit<RewardProps, "onClose">) => void;
}

const Ctx = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [t, setT] = useState<{ message: string; undo?: () => void; n: number } | null>(null);
  const [reward, setReward] = useState<(Omit<RewardProps, "onClose"> & { n: number }) | null>(null);
  const show = useCallback((message: string, undo?: () => void) => {
    setReward(null);
    setT((cur) => ({ message, undo, n: (cur?.n ?? 0) + 1 }));
  }, []);
  const celebrate = useCallback((r: Omit<RewardProps, "onClose">) => {
    setT(null);
    setReward((cur) => ({ ...r, n: (cur?.n ?? 0) + 1 }));
  }, []);
  const close = useCallback(() => setT(null), []);
  const closeReward = useCallback(() => setReward(null), []);
  const api = useMemo(() => ({ show, celebrate }), [show, celebrate]);
  return (
    <Ctx.Provider value={api}>
      {children}
      {reward && <Reward key={reward.n} kobo={reward.kobo} first={reward.first} streak={reward.streak} onUndo={reward.onUndo} onClose={closeReward} />}
      {t && <Toast key={t.n} message={t.message} actionLabel={t.undo ? "Undo" : undefined} onAction={t.undo} onClose={close} />}
    </Ctx.Provider>
  );
}

export function useToast(): ToastApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useToast must be used inside ToastProvider");
  return v;
}
