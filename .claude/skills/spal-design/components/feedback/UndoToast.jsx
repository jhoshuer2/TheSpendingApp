import React, { useEffect, useRef } from "react";
import { Icon } from "../core/Icon.jsx";

/** Undo toast — ink capsule with a draining horizon line along its bottom edge. SPAL's only destructive-action feedback. */
export function UndoToast({ message, onUndo, onExpire, duration = 10000 }) {
  const expiredRef = useRef(false);
  useEffect(() => {
    expiredRef.current = false;
    const t = setTimeout(() => { expiredRef.current = true; onExpire?.(); }, duration);
    return () => clearTimeout(t);
  }, [duration, onExpire]);

  return (
    <div className="spal-toast" style={{ position: "fixed", left: 16, right: 16, bottom: "calc(env(safe-area-inset-bottom, 0px) + 80px)", zIndex: 150 }}>
      <div style={{ position: "relative", overflow: "hidden", display: "flex", alignItems: "center", gap: 12, height: 52, padding: "0 8px 0 16px", borderRadius: "var(--radius-md)", background: "var(--ink-900)", boxShadow: "var(--shadow-2), var(--highlight-top-dark)" }}>
        <span style={{ color: "rgba(238,241,237,0.6)", display: "flex" }}><Icon name="trash" size={18} /></span>
        <p style={{ flex: 1, margin: 0, fontSize: 14, fontWeight: 500, color: "#EEF1ED", fontFamily: "var(--font-display)" }}>{message}</p>
        <button
          onClick={() => { if (!expiredRef.current) onUndo?.(); }}
          style={{ height: 36, padding: "0 12px", borderRadius: "var(--radius-sm)", background: "rgba(255,255,255,0.08)", border: "none", fontSize: 14, fontWeight: 500, color: "#8CD3A8", fontFamily: "var(--font-display)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
        ><Icon name="undo" size={16} />Undo</button>
        <span aria-hidden="true" style={{ position: "absolute", left: 0, bottom: 0, height: 2, width: "100%", background: "linear-gradient(90deg,rgba(70,178,122,0.2),rgba(70,178,122,0.9))", transformOrigin: "left", animation: `spal-undo-drain ${duration}ms linear forwards` }} />
      </div>
      <style>{`
        .spal-toast{animation:spal-toast-in var(--dur-3) var(--ease-out)}
        @keyframes spal-toast-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes spal-undo-drain{from{transform:scaleX(1)}to{transform:scaleX(0)}}
      `}</style>
    </div>
  );
}
