import React, { useState, useEffect } from "react";

/** "Ask SPAL" orb — the mascot's only in-product appearance. Fades in, then breathes slowly (4px, 5s). */
export function SparkAvatar({ onClick, size = 56, src = (typeof window !== "undefined" && window.__resources && window.__resources.sparkOrb) || "../../assets/brand/spal-ai-orb.webp" }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 300); return () => clearTimeout(t); }, []);
  return (
    <button onClick={onClick} aria-label="Ask SPAL" className="spal-spark"
      style={{
        width: size, height: size, background: "transparent", border: "none", padding: 0, cursor: "pointer",
        filter: "drop-shadow(0 8px 16px rgba(12,17,15,0.18))",
        opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(6px)",
        transition: "opacity var(--dur-4) var(--ease-out), transform var(--dur-4) var(--ease-out)",
      }}>
      <img src={src} alt="" style={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }} />
      <style>{`
        .spal-spark img{animation:spal-breathe 5s var(--ease-in-out) 1s infinite}
        .spal-spark:active img{transform:scale(0.94)}
        @keyframes spal-breathe{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
      `}</style>
    </button>
  );
}
