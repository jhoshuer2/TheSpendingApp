/* @ds-bundle: {"format":4,"namespace":"SpalDesignSystem_6a1cb4","components":[{"name":"Aura","sourcePath":"components/brand/Aura.jsx"},{"name":"SpalSymbol","sourcePath":"components/brand/SpalSymbol.jsx"},{"name":"SparkAvatar","sourcePath":"components/brand/SparkAvatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"Input","sourcePath":"components/core/Input.jsx"},{"name":"Money","sourcePath":"components/core/Money.jsx"},{"name":"PillChip","sourcePath":"components/core/PillChip.jsx"},{"name":"InsightCard","sourcePath":"components/feedback/InsightCard.jsx"},{"name":"Skeleton","sourcePath":"components/feedback/Skeleton.jsx"},{"name":"SkeletonRow","sourcePath":"components/feedback/Skeleton.jsx"},{"name":"UndoToast","sourcePath":"components/feedback/UndoToast.jsx"},{"name":"WeeklyChallengeCard","sourcePath":"components/gamification/WeeklyChallengeCard.jsx"},{"name":"BottomNav","sourcePath":"components/navigation/BottomNav.jsx"},{"name":"QuickMenuFab","sourcePath":"components/navigation/QuickMenuFab.jsx"},{"name":"TopNavPills","sourcePath":"components/navigation/TopNavPills.jsx"}],"sourceHashes":{"components/brand/Aura.jsx":"572043f65643","components/brand/SpalSymbol.jsx":"7361b5e7d5b5","components/brand/SparkAvatar.jsx":"a6498be19073","components/core/Badge.jsx":"9ac3d9792f4d","components/core/Button.jsx":"6f67c63abef8","components/core/Card.jsx":"7b2f0430c668","components/core/Icon.jsx":"1185c4033e98","components/core/Input.jsx":"79fa3b6a9569","components/core/Money.jsx":"978fb7190b37","components/core/PillChip.jsx":"63683867cd7b","components/feedback/InsightCard.jsx":"ecd2454844f4","components/feedback/Skeleton.jsx":"8ea43a43bafa","components/feedback/UndoToast.jsx":"6da2be2a169c","components/gamification/WeeklyChallengeCard.jsx":"764626a29d01","components/navigation/BottomNav.jsx":"3886a9e9c311","components/navigation/QuickMenuFab.jsx":"388e7a71dd1d","components/navigation/TopNavPills.jsx":"b9d4a4323931","ui_kits/mobile-app/AddRecordSheet.jsx":"82407ec83511","ui_kits/mobile-app/AppShell.jsx":"eb3400114f86","ui_kits/mobile-app/HomeScreen.jsx":"2c4ed851b353","ui_kits/mobile-app/Ledger.jsx":"c6a57e4b2cf1","ui_kits/mobile-app/RecordsScreen.jsx":"04549f192e41","ui_kits/mobile-app/WelcomeScreen.jsx":"8a65a16955e4"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.SpalDesignSystem_6a1cb4 = window.SpalDesignSystem_6a1cb4 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/brand/Aura.jsx
try { (() => {
/* Each blob: [left%, top%, width%, height%, color, opacity, driftSeconds] — positions may sit outside the frame so color bleeds in from the edges. */
const PALETTES = {
  night: {
    base: "#0B100E",
    blur: 0.16,
    blobs: [[-18, 52, 78, 70, "#1E7A4C", 0.85, 22], [52, 40, 70, 62, "#1B5C5A", 0.8, 26], [22, 78, 50, 34, "#8CD3A8", 0.42, 19], [62, 74, 42, 40, "#8A5F34", 0.38, 24], [-20, -22, 64, 52, "#2F4A24", 0.4, 30]]
  },
  dawn: {
    base: "#F6F6F1",
    blur: 0.14,
    blobs: [[-20, 58, 78, 66, "#BFE4CB", 1, 22], [50, 52, 72, 64, "#E1EDB9", 0.95, 26], [24, 74, 56, 44, "#F4D4B6", 0.9, 19], [56, -24, 62, 54, "#CFE2EA", 0.8, 28], [-24, -10, 56, 50, "#DCEBDF", 0.7, 32]]
  },
  mist: {
    base: "#EEF0EA",
    blur: 0.18,
    blobs: [[-14, -24, 70, 80, "#FFFFFF", 1, 24], [48, 50, 72, 70, "#CBE5D4", 0.95, 28], [44, -10, 50, 46, "#E7EFCB", 0.7, 22], [-10, 60, 48, 46, "#F1DFCB", 0.65, 26]]
  }
};

/**
 * SPAL Aura — the signature atmosphere. Large, soft, analogous color fields (forest, teal, mint, ember / mint, lime, sand, sky)
 * that settle low like light on a horizon and drift almost imperceptibly. Fills its positioned parent.
 */
function Aura({
  variant = "night",
  animate = true,
  intensity = 1,
  grain = true,
  style
}) {
  const p = PALETTES[variant] || PALETTES.night;
  return /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    className: "spal-aura",
    style: {
      position: "absolute",
      inset: 0,
      overflow: "hidden",
      background: p.base,
      borderRadius: "inherit",
      pointerEvents: "none",
      containerType: "size",
      ...style
    }
  }, p.blobs.map(([x, y, w, h, c, o, d], i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: animate ? "spal-aura-blob" : undefined,
    style: {
      position: "absolute",
      left: `${x}%`,
      top: `${y}%`,
      width: `${w}%`,
      height: `${h}%`,
      borderRadius: "50%",
      background: c,
      opacity: Math.min(1, o * intensity),
      filter: `blur(calc(${p.blur * 100}cqmin + 12px))`,
      animationDuration: `${d}s`,
      animationDelay: `${-i * 3.7}s`,
      animationName: `spal-aura-drift-${i % 3}`
    }
  })), grain && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      inset: 0,
      backgroundImage: "var(--texture-grain)",
      opacity: variant === "night" ? 0.9 : 0.7,
      mixBlendMode: variant === "night" ? "screen" : "multiply"
    }
  }), /*#__PURE__*/React.createElement("style", null, `
        .spal-aura-blob{animation-timing-function:var(--ease-in-out);animation-iteration-count:infinite;animation-direction:alternate;will-change:transform}
        @keyframes spal-aura-drift-0{from{transform:translate(0,0) scale(1)}to{transform:translate(6%,-4%) scale(1.06)}}
        @keyframes spal-aura-drift-1{from{transform:translate(0,0) scale(1.04)}to{transform:translate(-5%,3%) scale(0.97)}}
        @keyframes spal-aura-drift-2{from{transform:translate(0,0) rotate(0)}to{transform:translate(3%,5%) rotate(8deg)}}
        @media (prefers-reduced-motion: reduce){.spal-aura-blob{animation:none}}
      `));
}
Object.assign(__ds_scope, { Aura });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Aura.jsx", error: String((e && e.message) || e) }); }

// components/brand/SpalSymbol.jsx
try { (() => {
/**
 * SPAL symbols — hairline marks (1.25 stroke) with a single accent point. They stand in for
 * illustrations in empty states, loading, onboarding and section breaks. Never filled, never multicolor.
 */
const R = (cx, cy, r, o = 1) => /*#__PURE__*/React.createElement("circle", {
  cx: cx,
  cy: cy,
  r: r,
  opacity: o
});
const marks = {
  profit: a => /*#__PURE__*/React.createElement(React.Fragment, null, R(32, 32, 26, 0.28), R(32, 32, 18, 0.55), R(32, 32, 10), /*#__PURE__*/React.createElement("circle", {
    cx: "32",
    cy: "32",
    r: "2.5",
    fill: a,
    stroke: "none"
  })),
  flow: a => /*#__PURE__*/React.createElement(React.Fragment, null, R(32, 32, 24, 0.35), R(32, 32, 14), /*#__PURE__*/React.createElement("circle", {
    cx: "32",
    cy: "8",
    r: "2.5",
    fill: a,
    stroke: "none"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "46",
    cy: "32",
    r: "1.5",
    fill: "currentColor",
    stroke: "none",
    opacity: "0.5"
  })),
  growth: a => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "10",
    y: "38",
    width: "10",
    height: "16",
    rx: "2",
    opacity: "0.4"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "27",
    y: "26",
    width: "10",
    height: "28",
    rx: "2",
    opacity: "0.7"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "44",
    y: "12",
    width: "10",
    height: "42",
    rx: "2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "49",
    cy: "6",
    r: "2.5",
    fill: a,
    stroke: "none"
  })),
  focus: a => /*#__PURE__*/React.createElement(React.Fragment, null, R(32, 32, 26, 0.22), /*#__PURE__*/React.createElement("circle", {
    cx: "32",
    cy: "32",
    r: "18",
    strokeDasharray: "2 4",
    opacity: "0.6"
  }), R(32, 32, 8), /*#__PURE__*/React.createElement("circle", {
    cx: "32",
    cy: "32",
    r: "2.5",
    fill: a,
    stroke: "none"
  })),
  consistency: a => /*#__PURE__*/React.createElement("g", {
    stroke: "none"
  }, [14, 32, 50].map(x => [14, 32, 50].map(y => x === 32 && y === 32 ? /*#__PURE__*/React.createElement("circle", {
    key: "c",
    cx: "32",
    cy: "32",
    r: "3.5",
    fill: a
  }) : /*#__PURE__*/React.createElement("circle", {
    key: `${x}${y}`,
    cx: x,
    cy: y,
    r: "1.75",
    fill: "currentColor",
    opacity: "0.55"
  })))),
  momentum: a => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M6 44h12l8-22 8 22 6-12h18",
    opacity: "0.9"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "58",
    cy: "32",
    r: "2.5",
    fill: a,
    stroke: "none"
  })),
  insight: a => /*#__PURE__*/React.createElement(React.Fragment, null, Array.from({
    length: 12
  }).map((_, i) => {
    const t = i / 12 * Math.PI * 2;
    return /*#__PURE__*/React.createElement("line", {
      key: i,
      x1: 32 + Math.cos(t) * 16,
      y1: 32 + Math.sin(t) * 16,
      x2: 32 + Math.cos(t) * (i % 3 === 0 ? 26 : 22),
      y2: 32 + Math.sin(t) * (i % 3 === 0 ? 26 : 22),
      opacity: i % 3 === 0 ? 1 : 0.45
    });
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "32",
    cy: "32",
    r: "3",
    fill: a,
    stroke: "none"
  })),
  cashflow: a => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M4 30c7-12 13-12 20 0s13 12 20 0 13-12 16-6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4 40c7-12 13-12 20 0s13 12 20 0 13-12 16-6",
    opacity: "0.35"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "44",
    cy: "30",
    r: "2.5",
    fill: a,
    stroke: "none"
  }))
};
function SpalSymbol({
  symbol = "profit",
  color = "var(--text-primary)",
  accent = "var(--accent)",
  size = 64,
  spin = false
}) {
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 64 64",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.25,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      display: "block",
      color,
      ...(spin ? {
        animation: "spal-sym-spin 14s linear infinite"
      } : null)
    },
    "aria-hidden": "true"
  }, marks[symbol]?.(accent), spin && /*#__PURE__*/React.createElement("style", null, `@keyframes spal-sym-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`));
}
Object.assign(__ds_scope, { SpalSymbol });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/SpalSymbol.jsx", error: String((e && e.message) || e) }); }

// components/brand/SparkAvatar.jsx
try { (() => {
const {
  useState,
  useEffect
} = React;
/** "Ask SPAL" orb — the mascot's only in-product appearance. Fades in, then breathes slowly (4px, 5s). */
function SparkAvatar({
  onClick,
  size = 56,
  src = typeof window !== "undefined" && window.__resources && window.__resources.sparkOrb || "../../assets/brand/spal-ai-orb.webp"
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(t);
  }, []);
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    "aria-label": "Ask SPAL",
    className: "spal-spark",
    style: {
      width: size,
      height: size,
      background: "transparent",
      border: "none",
      padding: 0,
      cursor: "pointer",
      filter: "drop-shadow(0 8px 16px rgba(12,17,15,0.18))",
      opacity: mounted ? 1 : 0,
      transform: mounted ? "none" : "translateY(6px)",
      transition: "opacity var(--dur-4) var(--ease-out), transform var(--dur-4) var(--ease-out)"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: "",
    style: {
      display: "block",
      width: "100%",
      height: "100%",
      objectFit: "contain"
    }
  }), /*#__PURE__*/React.createElement("style", null, `
        .spal-spark img{animation:spal-breathe 5s var(--ease-in-out) 1s infinite}
        .spal-spark:active img{transform:scale(0.94)}
        @keyframes spal-breathe{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
      `));
}
Object.assign(__ds_scope, { SparkAvatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/SparkAvatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
const colors = {
  green: ["var(--green-50)", "var(--green-700)", "var(--green-500)"],
  orange: ["var(--clay-50)", "var(--clay-700)", "var(--clay-600)"],
  ochre: ["var(--ochre-50)", "var(--ochre-700)", "var(--ochre-600)"],
  blue: ["var(--iris-50)", "var(--iris-600)", "var(--iris-600)"],
  purple: ["var(--iris-50)", "var(--iris-600)", "var(--iris-600)"],
  gray: ["var(--surface-sunken)", "var(--ink-600)", "var(--ink-400)"],
  red: ["var(--red-50)", "var(--red-700)", "var(--red-600)"]
};

/** Small status label — 6px radius (not a pill), sentence case, quiet tint. */
function Badge({
  label,
  color = "gray",
  dot = false,
  size = "sm"
}) {
  const [bg, fg, dotColor] = colors[color] || colors.gray;
  const sm = size === "sm";
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      borderRadius: "var(--radius-xs)",
      fontFamily: "var(--font-body)",
      fontWeight: 500,
      letterSpacing: "0.005em",
      whiteSpace: "nowrap",
      height: sm ? 22 : 26,
      padding: sm ? "0 7px" : "0 9px",
      fontSize: sm ? 12 : 13,
      background: bg,
      color: fg
    }
  }, dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 5,
      height: 5,
      borderRadius: 999,
      background: dotColor,
      flexShrink: 0
    }
  }), label);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** SPAL button — tactile, not glowing: a lit top edge, a weighted bottom edge, 0.98 press. Pill radius. */
function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  icon,
  iconRight,
  disabled,
  children,
  style,
  className = "",
  ...props
}) {
  const variants = {
    primary: {
      background: "var(--accent)",
      color: "var(--text-on-accent)",
      boxShadow: "var(--shadow-tactile)"
    },
    secondary: {
      background: "var(--surface-card)",
      color: "var(--text-primary)",
      boxShadow: "var(--shadow-tactile-light)"
    },
    ghost: {
      background: "transparent",
      color: "var(--text-primary)",
      boxShadow: "none"
    },
    danger: {
      background: "var(--surface-card)",
      color: "var(--danger)",
      boxShadow: "var(--shadow-tactile-light)"
    }
  };
  const sizes = {
    sm: {
      height: "var(--control-h-sm)",
      padding: "0 14px",
      fontSize: 14,
      gap: 6
    },
    md: {
      height: "var(--control-h)",
      padding: "0 22px",
      fontSize: 15,
      gap: 8
    },
    lg: {
      height: "var(--control-h-lg)",
      padding: "0 28px",
      fontSize: 16,
      gap: 8
    }
  };
  const isDisabled = disabled || loading;
  return /*#__PURE__*/React.createElement("button", _extends({
    className: `spal-btn ${className}`,
    disabled: isDisabled,
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-display)",
      fontWeight: 500,
      letterSpacing: "-0.01em",
      whiteSpace: "nowrap",
      borderRadius: "var(--radius-full)",
      border: "none",
      cursor: isDisabled ? "default" : "pointer",
      width: fullWidth ? "100%" : "auto",
      opacity: disabled && !loading ? 0.42 : 1,
      transition: "transform var(--dur-1) var(--ease-out), filter var(--dur-2) var(--ease-out), opacity var(--dur-2) var(--ease-out)",
      WebkitTapHighlightColor: "transparent",
      ...variants[variant],
      ...sizes[size],
      ...style
    }
  }, props), loading ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      gap: 5
    },
    "aria-label": "Loading"
  }, [0, 1, 2].map(i => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: "spal-btn-dot",
    style: {
      animationDelay: `${i * 0.14}s`
    }
  }))) : /*#__PURE__*/React.createElement(React.Fragment, null, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      flexShrink: 0
    }
  }, icon), children, iconRight && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      flexShrink: 0
    }
  }, iconRight)), /*#__PURE__*/React.createElement("style", null, `
        .spal-btn:hover:not(:disabled){filter:brightness(1.04)}
        .spal-btn:active:not(:disabled){transform:scale(var(--press-scale))}
        .spal-btn:focus-visible{outline:none;box-shadow:var(--focus-ring)}
        .spal-btn-dot{width:5px;height:5px;border-radius:999px;background:currentColor;display:inline-block;animation:spal-btn-pulse 1s var(--ease-in-out) infinite}
        @keyframes spal-btn-pulse{0%,100%{opacity:.25;transform:translateY(0)}50%{opacity:1;transform:translateY(-2px)}}
      `));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const surfaces = {
  raised: {
    background: "var(--surface-card)",
    boxShadow: "var(--shadow-1), var(--highlight-top)"
  },
  sunken: {
    background: "var(--surface-sunken)",
    boxShadow: "none"
  },
  mist: {
    background: "var(--atmos-mist)",
    boxShadow: "var(--shadow-1)",
    aura: "mist"
  },
  night: {
    background: "#0B100E",
    boxShadow: "var(--highlight-top-dark)",
    color: "#EEF1ED",
    aura: "night"
  }
};
const hues = {
  green: "70,178,122",
  orange: "166,72,31",
  blue: "67,81,196",
  purple: "67,81,196"
};

/** SPAL card — a hairline ring, not a shadow. Use sparingly; prefer ledger rows and open sections. */
function Card({
  surface = "raised",
  accent = "none",
  padding = "md",
  elevated = false,
  children,
  style,
  className = "",
  ...props
}) {
  const paddings = {
    none: 0,
    sm: 12,
    md: 16,
    lg: 20
  };
  const {
    aura,
    ...s
  } = surfaces[surface] || surfaces.raised;
  return /*#__PURE__*/React.createElement("div", _extends({
    className: className,
    "data-theme": surface === "night" ? "night" : undefined,
    style: {
      position: "relative",
      overflow: "hidden",
      borderRadius: "var(--radius-md)",
      padding: paddings[padding],
      ...s,
      ...(elevated ? {
        boxShadow: "var(--shadow-2)"
      } : null),
      ...style
    }
  }, props), accent !== "none" && hues[accent] && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 1,
      background: `linear-gradient(90deg,rgba(${hues[accent]},0) 0%,rgba(${hues[accent]},0.6) 50%,rgba(${hues[accent]},0) 100%)`
    }
  }), aura && /*#__PURE__*/React.createElement(__ds_scope.Aura, {
    variant: aura
  }), aura ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, children) : children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
/* Lucide geometry (ISC), redrawn at SPAL's 1.6 stroke. Strings are paths; {c} circles; {r} rects. */
const G = {
  plus: ["M5 12h14", "M12 5v14"],
  x: ["M18 6 6 18", "m6 6 12 12"],
  check: ["M20 6 9 17l-5-5"],
  "chevron-right": ["m9 18 6-6-6-6"],
  "chevron-down": ["m6 9 6 6 6-6"],
  "chevron-left": ["m15 18-6-6 6-6"],
  "arrow-right": ["M5 12h14", "m12 5 7 7-7 7"],
  "arrow-up-right": ["M7 7h10v10", "M7 17 17 7"],
  "arrow-down-left": ["M17 7 7 17", "M17 17H7V7"],
  "trending-up": ["M22 7 13.5 15.5 8.5 10.5 2 17", "M16 7h6v6"],
  bell: ["M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9", "M10.3 21a1.94 1.94 0 0 0 3.4 0"],
  search: [{
    c: [11, 11, 8]
  }, "m21 21-4.3-4.3"],
  home: ["m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"],
  list: ["M8 6h13", "M8 12h13", "M8 18h13", "M3 6h.01", "M3 12h.01", "M3 18h.01"],
  chart: ["M3 3v18h18", "M18 17V9", "M13 17V5", "M8 17v-3"],
  user: ["M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2", {
    c: [12, 7, 4]
  }],
  message: ["M7.9 20A9 9 0 1 0 4 16.1L2 22Z"],
  target: [{
    c: [12, 12, 10]
  }, {
    c: [12, 12, 6]
  }, {
    c: [12, 12, 2]
  }],
  archive: [{
    r: [2, 3, 20, 5, 1]
  }, "M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8", "M10 12h4"],
  trash: ["M3 6h18", "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"],
  undo: ["M9 14 4 9l5-5", "M4 9h10.5a5.5 5.5 0 0 1 0 11H11"],
  clock: [{
    c: [12, 12, 10]
  }, "M12 6v6l4 2"],
  wallet: ["M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1", "M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"],
  menu: ["M4 12h16", "M4 6h16", "M4 18h16"]
};

/** SPAL icon — Lucide geometry at a refined 1.6 stroke, rounded caps/joins, currentColor. */
function Icon({
  name,
  size = 20,
  stroke = 1.6,
  color = "currentColor",
  style
}) {
  const parts = G[name] || [];
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      display: "block",
      flexShrink: 0,
      ...style
    },
    "aria-hidden": "true"
  }, parts.map((p, i) => typeof p === "string" ? /*#__PURE__*/React.createElement("path", {
    key: i,
    d: p
  }) : p.c ? /*#__PURE__*/React.createElement("circle", {
    key: i,
    cx: p.c[0],
    cy: p.c[1],
    r: p.c[2]
  }) : /*#__PURE__*/React.createElement("rect", {
    key: i,
    x: p.r[0],
    y: p.r[1],
    width: p.r[2],
    height: p.r[3],
    rx: p.r[4]
  })));
}
Icon.names = Object.keys(G);
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
/** Text field — hairline ring that becomes a green focus ring. `large` turns it into the hero amount field. */
function Input({
  label,
  hint,
  error,
  prefix,
  suffix,
  large = false,
  style,
  ...props
}) {
  const [focused, setFocused] = useState(false);
  const ring = error ? "0 0 0 1px var(--danger), 0 0 0 4px rgba(180,35,24,0.12)" : focused ? "0 0 0 1px var(--accent), var(--focus-ring)" : "0 0 0 1px var(--line-strong)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      fontFamily: "var(--font-body)"
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: "var(--text-secondary)"
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: large ? 6 : 8,
      background: "var(--surface-card)",
      borderRadius: large ? "var(--radius-md)" : "var(--radius-sm)",
      boxShadow: ring,
      height: large ? 76 : "var(--control-h)",
      padding: large ? "0 18px" : "0 14px",
      transition: "box-shadow var(--dur-2) var(--ease-out)",
      ...style
    }
  }, prefix && /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 500,
      color: "var(--text-tertiary)",
      fontSize: large ? 20 : 15,
      alignSelf: large ? "flex-start" : "center",
      marginTop: large ? 22 : 0,
      flexShrink: 0
    }
  }, prefix), /*#__PURE__*/React.createElement("input", _extends({
    style: {
      flex: 1,
      minWidth: 0,
      background: "transparent",
      border: "none",
      outline: "none",
      color: "var(--text-primary)",
      fontFamily: "var(--font-display)",
      fontSize: large ? 36 : 15,
      fontWeight: large ? 500 : 400,
      letterSpacing: large ? "-0.03em" : "-0.003em",
      fontVariantNumeric: "tabular-nums"
    },
    onFocus: e => {
      setFocused(true);
      props.onFocus?.(e);
    },
    onBlur: e => {
      setFocused(false);
      props.onBlur?.(e);
    }
  }, props)), suffix && /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      color: "var(--text-tertiary)"
    }
  }, suffix)), error && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12.5,
      color: "var(--danger)",
      fontWeight: 500,
      margin: 0
    }
  }, error), hint && !error && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12.5,
      color: "var(--text-secondary)",
      margin: 0
    }
  }, hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Input.jsx", error: String((e && e.message) || e) }); }

// components/core/Money.jsx
try { (() => {
/**
 * SPAL money figure — the signature typographic treatment: the number is loud, the ₦ is quiet
 * (small, raised, tertiary). Tabular figures. Direction tints the figure, never its container.
 */
function Money({
  value = 0,
  currency = "₦",
  size = 15,
  weight = 500,
  direction = "none",
  decimals = false,
  color,
  style
}) {
  const abs = Math.abs(Number(value) || 0);
  const whole = Math.floor(abs).toLocaleString("en-NG");
  const kobo = String(Math.round(abs % 1 * 100)).padStart(2, "0");
  const tone = color || (direction === "in" ? "var(--money-in)" : direction === "owed" ? "var(--money-owed)" : "var(--text-primary)");
  const sign = direction === "in" ? "+" : direction === "out" ? "\u2212" : "";
  const big = size >= 28;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "flex-start",
      fontFamily: "var(--font-display)",
      fontWeight: weight,
      fontSize: size,
      lineHeight: 1,
      letterSpacing: big ? "-0.035em" : "-0.01em",
      color: tone,
      fontVariantNumeric: "tabular-nums",
      whiteSpace: "nowrap",
      ...style
    }
  }, sign && /*#__PURE__*/React.createElement("span", {
    style: {
      marginRight: big ? "0.06em" : "0.08em",
      fontWeight: 400
    }
  }, sign), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: big ? "0.5em" : "0.78em",
      lineHeight: 1,
      marginTop: big ? "0.12em" : "0.08em",
      marginRight: big ? "0.08em" : "0.04em",
      color: direction === "none" && !color ? "var(--text-tertiary)" : "inherit",
      opacity: direction === "none" && !color ? 1 : 0.7,
      fontWeight: 500,
      letterSpacing: 0
    }
  }, currency), /*#__PURE__*/React.createElement("span", null, whole), decimals && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "0.5em",
      marginTop: "0.12em",
      marginLeft: "0.06em",
      color: "var(--text-tertiary)",
      letterSpacing: 0
    }
  }, kobo));
}
Object.assign(__ds_scope, { Money });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Money.jsx", error: String((e && e.message) || e) }); }

// components/core/PillChip.jsx
try { (() => {
const tint = {
  green: "var(--money-in)",
  orange: "var(--money-out)",
  blue: "var(--iris-600)",
  purple: "var(--iris-600)",
  gray: "currentColor"
};

/** Pill toggle — selection is shown in ink, not color. `color` only tints a leading icon. */
function PillChip({
  label,
  icon,
  color = "gray",
  selected = false,
  size = "md",
  onClick
}) {
  const sm = size === "sm";
  return /*#__PURE__*/React.createElement("button", {
    className: "spal-pillchip",
    onClick: onClick,
    "aria-pressed": selected,
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderRadius: "var(--radius-full)",
      fontFamily: "var(--font-display)",
      fontWeight: 500,
      cursor: "pointer",
      border: "none",
      whiteSpace: "nowrap",
      flexShrink: 0,
      background: selected ? "var(--ink-900)" : "var(--surface-card)",
      color: selected ? "#fff" : "var(--text-primary)",
      boxShadow: selected ? "inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px var(--ink-900)" : "var(--shadow-tactile-light)",
      height: sm ? "var(--control-h-sm)" : 44,
      padding: sm ? "0 14px" : "0 18px",
      fontSize: sm ? 14 : 15,
      transition: "transform var(--dur-1) var(--ease-out), background var(--dur-2) var(--ease-out), color var(--dur-2) var(--ease-out)",
      WebkitTapHighlightColor: "transparent"
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      color: selected ? "inherit" : tint[color]
    }
  }, icon), label, /*#__PURE__*/React.createElement("style", null, `.spal-pillchip:active{transform:scale(var(--press-scale))}`));
}
Object.assign(__ds_scope, { PillChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/PillChip.jsx", error: String((e && e.message) || e) }); }

// components/feedback/InsightCard.jsx
try { (() => {
const variants = {
  default: {
    surface: {
      background: "var(--surface-card)",
      boxShadow: "var(--shadow-1)"
    },
    tile: "var(--surface-sunken)",
    glyph: "var(--text-primary)",
    title: "var(--text-primary)",
    body: "var(--text-secondary)"
  },
  celebration: {
    surface: {
      background: "#0B100E",
      boxShadow: "var(--highlight-top-dark)"
    },
    aura: "night",
    tile: "rgba(255,255,255,0.08)",
    glyph: "#6CC796",
    title: "#EEF1ED",
    body: "rgba(238,241,237,0.66)",
    horizon: true
  },
  warning: {
    surface: {
      background: "var(--ochre-50)",
      boxShadow: "0 0 0 1px var(--ochre-100)"
    },
    tile: "var(--ochre-100)",
    glyph: "var(--ochre-700)",
    title: "var(--ochre-700)",
    body: "var(--ink-600)"
  },
  tip: {
    surface: {
      background: "var(--atmos-mist)",
      boxShadow: "var(--shadow-1)"
    },
    aura: "mist",
    tile: "rgba(255,255,255,0.8)",
    glyph: "var(--accent-text)",
    title: "var(--text-primary)",
    body: "var(--text-secondary)"
  }
};

/** Inline insight — daily nudges, tips, celebrations. Optional trailing metric. */
function InsightCard({
  title,
  message,
  variant = "default",
  icon,
  metric,
  metricLabel,
  positive
}) {
  const v = variants[variant] || variants.default;
  const metricColor = variant === "celebration" ? "#EEF1ED" : positive === true ? "var(--money-in)" : positive === false ? "var(--money-out)" : "var(--text-primary)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      overflow: "hidden",
      borderRadius: "var(--radius-md)",
      padding: 16,
      ...v.surface
    }
  }, v.aura && /*#__PURE__*/React.createElement(__ds_scope.Aura, {
    variant: v.aura
  }), v.horizon && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 1,
      background: "var(--horizon-line)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "flex",
      alignItems: "flex-start",
      gap: 12
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      width: 32,
      height: 32,
      borderRadius: "var(--radius-sm)",
      background: v.tile,
      color: v.glyph,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, icon), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      paddingTop: icon ? 1 : 0
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: 500,
      fontSize: 15,
      lineHeight: 1.35,
      letterSpacing: "-0.01em",
      color: v.title
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "3px 0 0",
      fontSize: 13.5,
      lineHeight: 1.45,
      color: v.body
    }
  }, message)), metric && /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: 500,
      fontSize: 20,
      letterSpacing: "-0.02em",
      fontVariantNumeric: "tabular-nums",
      color: metricColor
    }
  }, metric), metricLabel && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "2px 0 0",
      fontSize: 12,
      color: v.body
    }
  }, metricLabel))));
}
Object.assign(__ds_scope, { InsightCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/InsightCard.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Skeleton.jsx
try { (() => {
/** Placeholder bar — a slow, soft sheen across a recessed surface. SPAL never shows spinners. */
function Skeleton({
  width = "100%",
  height = 12,
  radius = 6,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "spal-skel",
    style: {
      width,
      height,
      borderRadius: radius,
      background: "var(--surface-sunken)",
      position: "relative",
      overflow: "hidden",
      ...style
    }
  }, /*#__PURE__*/React.createElement("style", null, `
        .spal-skel::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(255,255,255,0.55) 50%,rgba(255,255,255,0) 100%);transform:translateX(-100%);animation:spal-sheen 1.8s var(--ease-in-out) infinite}
        [data-theme="night"] .spal-skel::after{background:linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(255,255,255,0.05) 50%,rgba(255,255,255,0) 100%)}
        @keyframes spal-sheen{0%{transform:translateX(-100%)}60%,100%{transform:translateX(100%)}}
      `));
}

/** Skeleton in the exact shape of a ledger row. */
function SkeletonRow() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      height: "var(--row-h)",
      boxShadow: "inset 0 -1px 0 var(--line)"
    }
  }, /*#__PURE__*/React.createElement(Skeleton, {
    width: 40,
    height: 40,
    radius: 10
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Skeleton, {
    width: "52%",
    height: 11
  }), /*#__PURE__*/React.createElement(Skeleton, {
    width: "28%",
    height: 9
  })), /*#__PURE__*/React.createElement(Skeleton, {
    width: 56,
    height: 11
  }));
}
Object.assign(__ds_scope, { Skeleton, SkeletonRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Skeleton.jsx", error: String((e && e.message) || e) }); }

// components/feedback/UndoToast.jsx
try { (() => {
const {
  useEffect,
  useRef
} = React;
/** Undo toast — ink capsule with a draining horizon line along its bottom edge. SPAL's only destructive-action feedback. */
function UndoToast({
  message,
  onUndo,
  onExpire,
  duration = 10000
}) {
  const expiredRef = useRef(false);
  useEffect(() => {
    expiredRef.current = false;
    const t = setTimeout(() => {
      expiredRef.current = true;
      onExpire?.();
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onExpire]);
  return /*#__PURE__*/React.createElement("div", {
    className: "spal-toast",
    style: {
      position: "fixed",
      left: 16,
      right: 16,
      bottom: "calc(env(safe-area-inset-bottom, 0px) + 80px)",
      zIndex: 150
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      gap: 12,
      height: 52,
      padding: "0 8px 0 16px",
      borderRadius: "var(--radius-md)",
      background: "var(--ink-900)",
      boxShadow: "var(--shadow-2), var(--highlight-top-dark)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "rgba(238,241,237,0.6)",
      display: "flex"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "trash",
    size: 18
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      flex: 1,
      margin: 0,
      fontSize: 14,
      fontWeight: 500,
      color: "#EEF1ED",
      fontFamily: "var(--font-display)"
    }
  }, message), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (!expiredRef.current) onUndo?.();
    },
    style: {
      height: 36,
      padding: "0 12px",
      borderRadius: "var(--radius-sm)",
      background: "rgba(255,255,255,0.08)",
      border: "none",
      fontSize: 14,
      fontWeight: 500,
      color: "#8CD3A8",
      fontFamily: "var(--font-display)",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "undo",
    size: 16
  }), "Undo"), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: "absolute",
      left: 0,
      bottom: 0,
      height: 2,
      width: "100%",
      background: "linear-gradient(90deg,rgba(70,178,122,0.2),rgba(70,178,122,0.9))",
      transformOrigin: "left",
      animation: `spal-undo-drain ${duration}ms linear forwards`
    }
  })), /*#__PURE__*/React.createElement("style", null, `
        .spal-toast{animation:spal-toast-in var(--dur-3) var(--ease-out)}
        @keyframes spal-toast-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes spal-undo-drain{from{transform:scaleX(1)}to{transform:scaleX(0)}}
      `));
}
Object.assign(__ds_scope, { UndoToast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/UndoToast.jsx", error: String((e && e.message) || e) }); }

// components/gamification/WeeklyChallengeCard.jsx
try { (() => {
/** Weekly challenge — progress as discrete segments (one per step) when the target is small, a hairline bar when large. */
function WeeklyChallengeCard({
  label,
  current,
  target,
  completed = false
}) {
  const pct = Math.min(current / target, 1);
  const segmented = target <= 12;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: "var(--radius-md)",
      padding: 16,
      background: "var(--surface-card)",
      boxShadow: "var(--shadow-1), var(--highlight-top)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 12.5,
      fontWeight: 500,
      color: "var(--text-secondary)"
    }
  }, "Weekly challenge"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "4px 0 0",
      fontSize: 15,
      fontWeight: 500,
      color: "var(--text-primary)",
      lineHeight: 1.35,
      letterSpacing: "-0.01em",
      fontFamily: "var(--font-display)"
    }
  }, label)), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 17,
      fontWeight: 500,
      color: "var(--text-primary)",
      flexShrink: 0,
      fontVariantNumeric: "tabular-nums",
      fontFamily: "var(--font-display)"
    }
  }, current, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-tertiary)"
    }
  }, "/", target))), segmented ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      display: "flex",
      gap: 4
    }
  }, Array.from({
    length: target
  }).map((_, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      flex: 1,
      height: 6,
      borderRadius: 3,
      background: i < current ? "var(--accent)" : "var(--surface-sunken)",
      boxShadow: i < current ? "inset 0 1px 0 rgba(255,255,255,0.2)" : "inset 0 0 0 1px var(--line)",
      transition: `background var(--dur-3) var(--ease-out) ${i * 30}ms`
    }
  }))) : /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      height: 6,
      borderRadius: 3,
      background: "var(--surface-sunken)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      width: `${pct * 100}%`,
      borderRadius: 3,
      background: "var(--accent)",
      transition: "width var(--dur-4) var(--ease-out)"
    }
  })), completed && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "12px 0 0",
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: 13.5,
      fontWeight: 500,
      color: "var(--accent-text)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 16,
    stroke: 2
  }), "You finished this week's challenge"));
}
Object.assign(__ds_scope, { WeeklyChallengeCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/gamification/WeeklyChallengeCard.jsx", error: String((e && e.message) || e) }); }

// components/navigation/BottomNav.jsx
try { (() => {
const tabs = [{
  key: "home",
  label: "Home",
  icon: "home"
}, {
  key: "records",
  label: "Records",
  icon: "list"
}, {
  key: "insights",
  label: "Insights",
  icon: "chart"
}, {
  key: "profile",
  label: "Profile",
  icon: "user"
}];

/** Glass tab bar — hairline top edge, ink-weighted active state (no colored indicator). Inner/detail screens only. */
function BottomNav({
  active = "home",
  onChange
}) {
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      position: "fixed",
      bottom: 0,
      left: "50%",
      transform: "translateX(-50%)",
      width: "100%",
      maxWidth: "var(--shell-max-w)",
      background: "var(--surface-glass)",
      boxShadow: "inset 0 1px 0 var(--line)",
      backdropFilter: "saturate(180%) blur(var(--blur-glass))",
      WebkitBackdropFilter: "saturate(180%) blur(var(--blur-glass))",
      zIndex: 50
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-around",
      padding: "6px 8px calc(env(safe-area-inset-bottom,0px) + 6px)"
    }
  }, tabs.map(t => {
    const on = t.key === active;
    return /*#__PURE__*/React.createElement("button", {
      key: t.key,
      onClick: () => onChange?.(t.key),
      "aria-current": on ? "page" : undefined,
      style: {
        background: "none",
        border: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        minWidth: 64,
        minHeight: 50,
        justifyContent: "center",
        cursor: "pointer",
        color: on ? "var(--text-primary)" : "var(--text-tertiary)",
        transition: "color var(--dur-2) var(--ease-out)"
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: t.icon,
      size: 22,
      stroke: on ? 2 : 1.6
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: "0.01em",
        fontFamily: "var(--font-display)"
      }
    }, t.label));
  })));
}
Object.assign(__ds_scope, { BottomNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/BottomNav.jsx", error: String((e && e.message) || e) }); }

// components/navigation/QuickMenuFab.jsx
try { (() => {
const {
  useState,
  useRef,
  useEffect
} = React;
const items = [{
  key: "sale",
  label: "Record sale",
  icon: "arrow-down-left",
  tone: "var(--money-in)"
}, {
  key: "expense",
  label: "Record expense",
  icon: "arrow-up-right",
  tone: "var(--money-out)"
}, {
  key: "ask",
  label: "Ask SPAL",
  icon: "message",
  tone: "var(--iris-600)"
}, {
  key: "goals",
  label: "Set a goal",
  icon: "target",
  tone: "var(--text-primary)"
}, {
  key: "inventory",
  label: "Inventory",
  icon: "archive",
  tone: "var(--text-primary)"
}];

/** Quick menu — an ink capsule whose plus turns 45° into a close; the menu rises item by item. The app's primary entry point. */
function QuickMenuFab({
  onSelect
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    style: {
      position: "absolute",
      zIndex: 50,
      right: 16,
      bottom: "calc(env(safe-area-inset-bottom,0px) + 24px)"
    }
  }, open && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      bottom: 64,
      right: 0,
      width: 220,
      padding: 6,
      background: "var(--surface-card)",
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow-2)",
      transformOrigin: "bottom right",
      animation: "spal-menu-in var(--dur-3) var(--ease-out)"
    }
  }, items.map((it, i) => /*#__PURE__*/React.createElement("button", {
    key: it.key,
    className: "spal-menu-item",
    onClick: () => {
      setOpen(false);
      onSelect?.(it.key);
    },
    style: {
      width: "100%",
      height: 48,
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "0 10px",
      background: "none",
      border: "none",
      borderRadius: "var(--radius-sm)",
      textAlign: "left",
      cursor: "pointer",
      animation: `spal-item-in var(--dur-3) var(--ease-out) ${i * 30}ms both`
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 32,
      height: 32,
      borderRadius: 9,
      background: "var(--surface-sunken)",
      color: it.tone,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: it.icon,
    size: 17
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 500,
      color: "var(--text-primary)",
      fontFamily: "var(--font-display)",
      letterSpacing: "-0.005em"
    }
  }, it.label)))), /*#__PURE__*/React.createElement("button", {
    className: "spal-fab",
    onClick: () => setOpen(o => !o),
    "aria-expanded": open,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      height: 52,
      padding: "0 20px 0 16px",
      borderRadius: "var(--radius-full)",
      border: "none",
      cursor: "pointer",
      background: "var(--ink-900)",
      color: "#EEF1ED",
      fontWeight: 500,
      fontSize: 15,
      fontFamily: "var(--font-display)",
      whiteSpace: "nowrap",
      boxShadow: "var(--shadow-2), inset 0 1px 0 rgba(255,255,255,0.1)",
      transition: "transform var(--dur-1) var(--ease-out)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      transform: open ? "rotate(45deg)" : "none",
      transition: "transform var(--dur-3) var(--ease-out)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "plus",
    size: 20,
    stroke: 1.8
  })), open ? "Close" : "Quick menu"), /*#__PURE__*/React.createElement("style", null, `
        .spal-fab:active{transform:scale(var(--press-scale))}
        .spal-menu-item:hover{background:var(--surface-sunken)!important}
        .spal-menu-item:active{transform:scale(0.99)}
        @keyframes spal-menu-in{from{opacity:0;transform:translateY(6px) scale(0.98)}to{opacity:1;transform:none}}
        @keyframes spal-item-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
      `));
}
Object.assign(__ds_scope, { QuickMenuFab });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/QuickMenuFab.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TopNavPills.jsx
try { (() => {
const tabs = [{
  key: "home",
  label: "Home"
}, {
  key: "records",
  label: "Records"
}, {
  key: "insights",
  label: "Insights"
}];

/** Segmented control — a recessed track with a raised thumb that glides between segments. Primary nav on Home/Records/Insights. */
function TopNavPills({
  active = "home",
  onChange
}) {
  const idx = Math.max(0, tabs.findIndex(t => t.key === active));
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      position: "relative",
      display: "flex",
      height: 40,
      padding: 3,
      borderRadius: "var(--radius-full)",
      background: "var(--surface-sunken)",
      boxShadow: "inset 0 1px 2px rgba(20,26,23,0.05)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: "absolute",
      top: 3,
      bottom: 3,
      left: 3,
      width: `calc((100% - 6px) / ${tabs.length})`,
      transform: `translateX(${idx * 100}%)`,
      borderRadius: "var(--radius-full)",
      background: "var(--surface-card)",
      boxShadow: "var(--shadow-tactile-light)",
      transition: "transform var(--dur-3) var(--ease-out)"
    }
  }), tabs.map(t => {
    const on = t.key === active;
    return /*#__PURE__*/React.createElement("button", {
      key: t.key,
      role: "tab",
      "aria-selected": on,
      onClick: () => onChange?.(t.key),
      style: {
        position: "relative",
        flex: 1,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        borderRadius: "var(--radius-full)",
        fontFamily: "var(--font-display)",
        fontWeight: 500,
        fontSize: 14,
        letterSpacing: "-0.005em",
        color: on ? "var(--text-primary)" : "var(--text-secondary)",
        transition: "color var(--dur-2) var(--ease-out)"
      }
    }, t.label);
  }));
}
Object.assign(__ds_scope, { TopNavPills });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TopNavPills.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile-app/AddRecordSheet.jsx
try { (() => {
const {
  useState: useStateAS,
  useEffect: useEffectAS
} = React;
const SALE_CATS = ["Food", "Drinks", "Breakfast", "Lunch", "Dinner"];
const EXPENSE_CATS = ["Transport", "Groceries", "Utilities", "Rent", "Marketing"];

/** Two-option segmented control with a gliding thumb. */
function Segmented({
  options,
  value,
  onChange
}) {
  const idx = Math.max(0, options.findIndex(([k]) => k === value));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "flex",
      height: 44,
      padding: 3,
      borderRadius: 999,
      background: "var(--surface-sunken)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 3,
      bottom: 3,
      left: 3,
      width: `calc((100% - 6px) / ${options.length})`,
      transform: `translateX(${idx * 100}%)`,
      borderRadius: 999,
      background: "var(--surface-card)",
      boxShadow: "var(--shadow-tactile-light)",
      transition: "transform var(--dur-3) var(--ease-out)"
    }
  }), options.map(([k, l]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => onChange(k),
    style: {
      position: "relative",
      flex: 1,
      border: "none",
      background: "transparent",
      cursor: "pointer",
      fontFamily: "var(--font-display)",
      fontWeight: 500,
      fontSize: 14,
      color: value === k ? "var(--text-primary)" : "var(--text-secondary)"
    }
  }, l)));
}

/** Add sale / expense sheet — the core data-entry surface. */
function AddRecordSheet({
  type,
  open,
  onClose
}) {
  const {
    Button,
    PillChip,
    Input,
    Icon,
    SpalSymbol,
    Money
  } = window.SpalDesignSystem_6a1cb4;
  const [amount, setAmount] = useStateAS("");
  const [desc, setDesc] = useStateAS("");
  const [cat, setCat] = useStateAS("");
  const [status, setStatus] = useStateAS("paid");
  const [saved, setSaved] = useStateAS(false);
  const [closing, setClosing] = useStateAS(false);
  useEffectAS(() => {
    if (open) {
      setAmount("");
      setDesc("");
      setCat("");
      setStatus("paid");
      setSaved(false);
      setClosing(false);
    }
  }, [open, type]);
  if (!open) return null;
  const isSale = type === "sale";
  const cats = isSale ? SALE_CATS : EXPENSE_CATS;
  const value = Number(String(amount).replace(/[^0-9.]/g, "")) || 0;
  const close = () => {
    setClosing(true);
    setTimeout(onClose, 220);
  };
  const save = () => {
    setSaved(true);
    setTimeout(close, 1100);
  };
  const label = {
    display: "block",
    fontSize: 13,
    fontWeight: 500,
    color: "var(--text-secondary)",
    margin: "0 0 8px"
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    onClick: close,
    style: {
      position: "absolute",
      inset: 0,
      background: "var(--backdrop-sheet)",
      zIndex: 55,
      opacity: closing ? 0 : 1,
      animation: "fade-in var(--dur-3) var(--ease-out)",
      transition: "opacity 220ms var(--ease-in)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 60,
      background: "var(--surface-card)",
      borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
      boxShadow: "var(--shadow-3)",
      maxHeight: "90%",
      display: "flex",
      flexDirection: "column",
      transform: closing ? "translateY(100%)" : "none",
      animation: "sheet-up var(--dur-3) var(--ease-out)",
      transition: "transform 220ms var(--ease-in)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      padding: "10px 0 2px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 4,
      borderRadius: 999,
      background: "var(--ink-200)"
    }
  })), saved ? /*#__PURE__*/React.createElement("div", {
    className: "enter",
    style: {
      padding: "40px 20px 56px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 14,
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement(SpalSymbol, {
    symbol: "profit",
    size: 72
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 20,
      fontWeight: 500,
      letterSpacing: "-0.016em"
    }
  }, "Nice one \u2014 saved"), /*#__PURE__*/React.createElement(Money, {
    value: value,
    direction: isSale ? status === "owing" ? "owed" : "in" : "out",
    size: 20
  })) : /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 20px 28px",
      overflowY: "auto",
      overflowX: "hidden",
      scrollbarWidth: "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 20,
      fontWeight: 500,
      letterSpacing: "-0.016em",
      whiteSpace: "nowrap",
      textWrap: "nowrap"
    }
  }, isSale ? "New sale" : "New expense"), /*#__PURE__*/React.createElement("button", {
    onClick: close,
    "aria-label": "Close",
    style: {
      width: 32,
      height: 32,
      borderRadius: 999,
      background: "var(--surface-sunken)",
      border: "none",
      color: "var(--text-secondary)",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    size: 16
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "How much?",
    large: true,
    prefix: "\u20A6",
    placeholder: "0",
    inputMode: "decimal",
    value: amount,
    onChange: e => setAmount(e.target.value),
    autoFocus: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "What was it for?",
    placeholder: isSale ? "e.g. Suya, drinks, rice" : "e.g. Fuel, stock, salary",
    value: desc,
    onChange: e => setDesc(e.target.value)
  })), /*#__PURE__*/React.createElement("span", {
    style: label
  }, "Category"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 20
    }
  }, cats.map(c => /*#__PURE__*/React.createElement(PillChip, {
    key: c,
    label: c,
    size: "sm",
    selected: cat === c,
    onClick: () => setCat(cat === c ? "" : c)
  }))), isSale && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: label
  }, "Did they pay?"), /*#__PURE__*/React.createElement(Segmented, {
    options: [["paid", "Paid now"], ["owing", "Owes me"]],
    value: status,
    onChange: setStatus
  })), /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    fullWidth: true,
    disabled: !value,
    onClick: save
  }, isSale ? "Save sale" : "Save expense"))));
}
window.AddRecordSheet = AddRecordSheet;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile-app/AddRecordSheet.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile-app/AppShell.jsx
try { (() => {
const {
  useState: useStateApp
} = React;

/** Composes the click-through: onboarding → home ⇄ records, Add sheet, quick menu, Ask SPAL orb, paper/night theme. */
function AppShell() {
  const {
    QuickMenuFab,
    SparkAvatar
  } = window.SpalDesignSystem_6a1cb4;
  const [screen, setScreen] = useStateApp("welcome");
  const [sheet, setSheet] = useStateApp(null);
  const [theme, setTheme] = useStateApp(() => localStorage.getItem("spal-kit-theme") || "paper");
  const Welcome = window.WelcomeScreen,
    Home = window.HomeScreen,
    Records = window.RecordsScreen,
    Sheet = window.AddRecordSheet;
  const pickTheme = t => {
    setTheme(t);
    localStorage.setItem("spal-kit-theme", t);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: "var(--surface-canvas-dark)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 16,
      right: 16,
      display: "flex",
      gap: 2,
      padding: 3,
      borderRadius: 999,
      background: "rgba(255,255,255,0.06)",
      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)"
    }
  }, [["paper", "Paper"], ["night", "Night"]].map(([k, l]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => pickTheme(k),
    style: {
      height: 30,
      padding: "0 14px",
      borderRadius: 999,
      border: "none",
      cursor: "pointer",
      fontFamily: "var(--font-display)",
      fontSize: 13,
      fontWeight: 500,
      background: theme === k ? "rgba(255,255,255,0.12)" : "transparent",
      color: theme === k ? "#EEF1ED" : "rgba(238,241,237,0.5)"
    }
  }, l))), /*#__PURE__*/React.createElement("div", {
    "data-theme": theme === "night" ? "night" : undefined,
    style: {
      position: "relative",
      width: 390,
      height: 800,
      maxHeight: "94vh",
      borderRadius: 44,
      overflow: "hidden",
      boxShadow: "var(--shadow-shell)",
      background: "var(--surface-app)"
    }
  }, screen === "welcome" && /*#__PURE__*/React.createElement(Welcome, {
    onGetStarted: () => setScreen("home"),
    onLogin: () => setScreen("home")
  }), screen === "home" && /*#__PURE__*/React.createElement(Home, {
    key: "home",
    onNavigate: setScreen,
    onOpenSheet: setSheet
  }), screen === "records" && /*#__PURE__*/React.createElement(Records, {
    key: "records",
    onNavigate: setScreen,
    onOpenSheet: setSheet
  }), screen !== "welcome" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 112,
      zIndex: 39,
      pointerEvents: "none",
      background: "linear-gradient(180deg, color-mix(in srgb, var(--surface-app) 0%, transparent) 0%, var(--surface-app) 70%)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 16,
      bottom: 24,
      zIndex: 40
    }
  }, /*#__PURE__*/React.createElement(SparkAvatar, {
    size: 52
  })), /*#__PURE__*/React.createElement(QuickMenuFab, {
    onSelect: k => {
      if (k === "sale" || k === "expense") setSheet(k);
    }
  })), /*#__PURE__*/React.createElement(Sheet, {
    type: sheet,
    open: !!sheet,
    onClose: () => setSheet(null)
  })));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(AppShell, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile-app/AppShell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile-app/HomeScreen.jsx
try { (() => {
const RECENT = [{
  id: 1,
  type: "sale",
  desc: "Suya, drinks",
  cat: "Food",
  time: "2:45 PM",
  amount: 4500
}, {
  id: 2,
  type: "expense",
  desc: "Fuel",
  cat: "Transport",
  time: "1:10 PM",
  amount: 3000
}, {
  id: 3,
  type: "sale",
  desc: "Rice & stew",
  cat: "Lunch",
  time: "12:30 PM",
  amount: 8200
}];

/** Home — profit hero on the night horizon, sale/expense split, owed row, recent activity. */
function HomeScreen({
  onNavigate,
  onOpenSheet
}) {
  const {
    TopNavPills,
    Money,
    Icon,
    Aura
  } = window.SpalDesignSystem_6a1cb4;
  const {
    ScreenHeader,
    SectionTitle,
    Ledger,
    useCountUp
  } = window;
  const profit = useCountUp(48200);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      overflowY: "auto",
      overflowX: "hidden",
      scrollbarWidth: "none",
      background: "var(--surface-app)"
    }
  }, /*#__PURE__*/React.createElement(ScreenHeader, null), /*#__PURE__*/React.createElement("div", {
    className: "enter",
    style: {
      padding: "20px 20px 0",
      animationDelay: "30ms"
    }
  }, /*#__PURE__*/React.createElement(TopNavPills, {
    active: "home",
    onChange: onNavigate
  })), /*#__PURE__*/React.createElement("div", {
    className: "enter",
    style: {
      padding: "24px 20px 0",
      animationDelay: "60ms"
    }
  }, /*#__PURE__*/React.createElement("div", {
    "data-theme": "night",
    style: {
      position: "relative",
      overflow: "hidden",
      borderRadius: "var(--radius-lg)",
      background: "#0B100E",
      boxShadow: "var(--highlight-top-dark)",
      padding: "20px 20px 0",
      color: "var(--text-primary)"
    }
  }, /*#__PURE__*/React.createElement(Aura, {
    variant: "night"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      color: "var(--text-secondary)",
      whiteSpace: "nowrap"
    }
  }, "Profit today"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 12.5,
      fontWeight: 500,
      color: "var(--money-in)",
      whiteSpace: "nowrap"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trending-up",
    size: 15
  }), "18% vs last Tue")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(Money, {
    value: profit,
    size: 48
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 28,
      height: 1,
      background: "var(--horizon-line)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1px 1fr"
    }
  }, [["sale", "Sales", 62000], null, ["expense", "Expenses", 13800]].map((c, i) => c ? /*#__PURE__*/React.createElement("button", {
    key: c[0],
    className: "press",
    onClick: () => onOpenSheet(c[0]),
    style: {
      textAlign: "left",
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: i === 0 ? "16px 12px 18px 0" : "16px 0 18px 16px",
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between",
      color: "var(--text-primary)"
    }
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontSize: 13,
      color: "var(--text-secondary)",
      marginBottom: 6
    }
  }, c[1]), /*#__PURE__*/React.createElement(Money, {
    value: c[2],
    size: 20
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 28,
      height: 28,
      borderRadius: 8,
      background: "rgba(255,255,255,0.09)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "var(--text-secondary)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 16
  }))) : /*#__PURE__*/React.createElement("span", {
    key: "d",
    style: {
      background: "var(--line)",
      margin: "14px 0"
    }
  })))))), /*#__PURE__*/React.createElement("div", {
    className: "enter",
    style: {
      padding: "12px 20px 0",
      animationDelay: "90ms"
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "press",
    onClick: () => onNavigate("records"),
    style: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 12,
      height: 64,
      padding: "0 14px 0 12px",
      borderRadius: "var(--radius-md)",
      border: "none",
      background: "var(--surface-card)",
      boxShadow: "var(--shadow-1), var(--highlight-top)",
      cursor: "pointer",
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 10,
      background: "var(--ochre-50)",
      color: "var(--ochre-600)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "wallet",
    size: 18
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontSize: 15,
      fontWeight: 500,
      color: "var(--text-primary)"
    }
  }, "Owed to you"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontSize: 13,
      color: "var(--text-secondary)",
      marginTop: 2
    }
  }, "2 customers haven't paid")), /*#__PURE__*/React.createElement(Money, {
    value: 6500,
    direction: "owed",
    size: 15
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-tertiary)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 18
  })))), /*#__PURE__*/React.createElement("div", {
    className: "enter",
    style: {
      padding: "36px 20px 132px",
      animationDelay: "120ms"
    }
  }, /*#__PURE__*/React.createElement(SectionTitle, {
    action: "View all",
    onAction: () => onNavigate("records")
  }, "Recent activity"), /*#__PURE__*/React.createElement(Ledger, {
    rows: RECENT
  })));
}
window.HomeScreen = HomeScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile-app/HomeScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile-app/Ledger.jsx
try { (() => {
const {
  useState: useStateLR,
  useEffect: useEffectLR
} = React;

/** Count a number up to its target with the "settle" curve. */
function useCountUp(target, ms = 560) {
  const [v, setV] = useStateLR(0);
  useEffectLR(() => {
    const t0 = Date.now();
    const id = setInterval(() => {
      const p = Math.min((Date.now() - t0) / ms, 1);
      setV(Math.round(target * (1 - Math.pow(1 - p, 4))));
      if (p >= 1) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [target, ms]);
  return v;
}

/** Screen header — date line + business name, bell and avatar. */
function ScreenHeader() {
  const {
    Icon
  } = window.SpalDesignSystem_6a1cb4;
  return /*#__PURE__*/React.createElement("div", {
    className: "enter",
    style: {
      padding: "56px 20px 0",
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 13.5,
      color: "var(--text-secondary)"
    }
  }, "Tuesday, 14 October"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: "4px 0 0",
      fontSize: 26,
      fontWeight: 500,
      letterSpacing: "-0.022em",
      color: "var(--text-primary)",
      whiteSpace: "nowrap",
      textWrap: "nowrap"
    }
  }, "Ada's Kitchen")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "press",
    "aria-label": "Notifications",
    style: {
      width: 40,
      height: 40,
      borderRadius: 999,
      border: "none",
      background: "var(--surface-card)",
      boxShadow: "var(--shadow-1)",
      color: "var(--text-primary)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bell",
    size: 19
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 9,
      right: 10,
      width: 6,
      height: 6,
      borderRadius: 999,
      background: "var(--accent)",
      boxShadow: "0 0 0 2px var(--surface-card)"
    }
  })), /*#__PURE__*/React.createElement("button", {
    className: "press",
    "aria-label": "Profile",
    style: {
      width: 40,
      height: 40,
      borderRadius: 999,
      border: "none",
      background: "var(--ink-900)",
      color: "#EEF1ED",
      fontWeight: 500,
      fontSize: 15,
      cursor: "pointer",
      fontFamily: "var(--font-display)"
    }
  }, "A")));
}

/** Section title row. */
function SectionTitle({
  children,
  action,
  onAction
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 17,
      fontWeight: 500,
      letterSpacing: "-0.01em",
      color: "var(--text-primary)"
    }
  }, children), action && /*#__PURE__*/React.createElement("button", {
    onClick: onAction,
    style: {
      background: "none",
      border: "none",
      padding: 0,
      fontSize: 13.5,
      fontWeight: 500,
      color: "var(--text-secondary)",
      cursor: "pointer",
      fontFamily: "var(--font-display)"
    }
  }, action));
}

/** Ledger row — the signature list unit: 60px, sunken 40px tile, hairline inset after the tile. */
function LedgerRow({
  r,
  first
}) {
  const {
    Icon,
    Money,
    Badge
  } = window.SpalDesignSystem_6a1cb4;
  const isSale = r.type === "sale";
  return /*#__PURE__*/React.createElement("div", {
    className: "row-press",
    style: {
      position: "relative",
      height: "var(--row-h)",
      display: "flex",
      alignItems: "center",
      gap: 12,
      cursor: "pointer"
    }
  }, !first && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: 52,
      right: 0,
      top: 0,
      height: 1,
      background: "var(--line)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 10,
      background: "var(--surface-sunken)",
      color: isSale ? "var(--money-in)" : "var(--money-out)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: isSale ? "arrow-down-left" : "arrow-up-right",
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 15,
      fontWeight: 500,
      color: "var(--text-primary)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      letterSpacing: "-0.005em"
    }
  }, r.desc), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "2px 0 0",
      fontSize: 13,
      color: "var(--text-secondary)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, r.customer ? `${r.customer} · ` : "", r.cat, " \xB7 ", r.time)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      gap: 4,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Money, {
    value: r.amount,
    direction: r.owing ? "owed" : isSale ? "in" : "out",
    size: 15
  }), r.owing && /*#__PURE__*/React.createElement(Badge, {
    label: "Owing",
    color: "ochre"
  })));
}

/** Grouped ledger list on a raised surface. */
function Ledger({
  rows
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      borderRadius: "var(--radius-md)",
      boxShadow: "var(--shadow-1), var(--highlight-top)",
      padding: "0 16px"
    }
  }, rows.map((r, i) => /*#__PURE__*/React.createElement(LedgerRow, {
    key: r.id,
    r: r,
    first: i === 0
  })));
}
Object.assign(window, {
  useCountUp,
  ScreenHeader,
  SectionTitle,
  LedgerRow,
  Ledger
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile-app/Ledger.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile-app/RecordsScreen.jsx
try { (() => {
const {
  useState: useStateRS
} = React;
const DAYS = [["Today", [{
  id: 1,
  type: "sale",
  desc: "Suya, drinks",
  cat: "Food",
  time: "2:45 PM",
  amount: 4500
}, {
  id: 2,
  type: "expense",
  desc: "Fuel",
  cat: "Transport",
  time: "1:10 PM",
  amount: 3000
}, {
  id: 3,
  type: "sale",
  desc: "Rice & stew",
  cat: "Lunch",
  time: "12:30 PM",
  amount: 8200,
  owing: true,
  customer: "Mama Ngozi"
}]], ["Yesterday", [{
  id: 4,
  type: "sale",
  desc: "Drinks",
  cat: "Drinks",
  time: "6:20 PM",
  amount: 2200
}, {
  id: 5,
  type: "expense",
  desc: "Stock",
  cat: "Groceries",
  time: "9:00 AM",
  amount: 12000
}]]];
const FILTERS = [["all", "All"], ["sale", "Sales"], ["expense", "Expenses"], ["owing", "Owing"]];

/** Records — filterable, date-grouped ledger with day totals and an owed summary. */
function RecordsScreen({
  onNavigate
}) {
  const {
    TopNavPills,
    PillChip,
    Money,
    Icon,
    SpalSymbol
  } = window.SpalDesignSystem_6a1cb4;
  const {
    ScreenHeader,
    Ledger
  } = window;
  const [filter, setFilter] = useStateRS("all");
  const match = r => filter === "all" || (filter === "owing" ? r.owing : r.type === filter);
  const groups = DAYS.map(([d, rows]) => [d, rows.filter(match)]).filter(([, rows]) => rows.length);
  const net = rows => rows.reduce((s, r) => s + (r.type === "sale" ? r.amount : -r.amount), 0);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      overflowY: "auto",
      overflowX: "hidden",
      scrollbarWidth: "none",
      background: "var(--surface-app)"
    }
  }, /*#__PURE__*/React.createElement(ScreenHeader, null), /*#__PURE__*/React.createElement("div", {
    className: "enter",
    style: {
      padding: "20px 20px 0",
      animationDelay: "30ms"
    }
  }, /*#__PURE__*/React.createElement(TopNavPills, {
    active: "records",
    onChange: onNavigate
  })), /*#__PURE__*/React.createElement("div", {
    className: "enter",
    style: {
      padding: "20px 20px 0",
      display: "flex",
      gap: 8,
      overflowX: "auto",
      scrollbarWidth: "none",
      animationDelay: "60ms"
    }
  }, FILTERS.map(([k, l]) => /*#__PURE__*/React.createElement(PillChip, {
    key: k,
    size: "sm",
    label: l,
    selected: filter === k,
    onClick: () => setFilter(k)
  }))), filter !== "owing" && /*#__PURE__*/React.createElement("div", {
    className: "enter",
    style: {
      padding: "16px 20px 0",
      animationDelay: "90ms"
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "press",
    onClick: () => setFilter("owing"),
    style: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "12px 14px",
      borderRadius: "var(--radius-md)",
      border: "none",
      background: "var(--ochre-50)",
      boxShadow: "0 0 0 1px var(--ochre-100)",
      cursor: "pointer",
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: "var(--ochre-600)",
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 13.5,
      color: "var(--ochre-700)"
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      fontWeight: 500
    }
  }, "\u20A68,200 owed"), " \xB7 Mama Ngozi hasn't paid yet"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--ochre-600)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 16
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "28px 20px 132px",
      display: "flex",
      flexDirection: "column",
      gap: 28
    }
  }, groups.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "enter",
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 14,
      padding: "40px 0",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement(SpalSymbol, {
    symbol: "consistency",
    size: 64
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 17,
      fontWeight: 500
    }
  }, "Nothing here"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 13.5,
      color: "var(--text-secondary)"
    }
  }, "Try another filter.")), groups.map(([day, rows], gi) => /*#__PURE__*/React.createElement("div", {
    key: day + filter,
    className: "enter",
    style: {
      animationDelay: `${120 + gi * 30}ms`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: 10,
      padding: "0 2px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 500,
      color: "var(--text-secondary)"
    }
  }, day), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-tertiary)",
      display: "inline-flex",
      gap: 4
    }
  }, "Net ", /*#__PURE__*/React.createElement(Money, {
    value: net(rows),
    size: 13,
    color: "var(--text-secondary)"
  }))), /*#__PURE__*/React.createElement(Ledger, {
    rows: rows
  })))));
}
window.RecordsScreen = RecordsScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile-app/RecordsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile-app/WelcomeScreen.jsx
try { (() => {
const {
  useEffect: useEffectWS,
  useState: useStateWS
} = React;

/** Onboarding — splash wordmark on the night horizon, then the welcome: one symbol, one promise, one action. */
function WelcomeScreen({
  onGetStarted,
  onLogin
}) {
  const {
    SpalSymbol,
    Button,
    Aura
  } = window.SpalDesignSystem_6a1cb4;
  const [splash, setSplash] = useStateWS(true);
  useEffectWS(() => {
    const t = setTimeout(() => setSplash(false), 1300);
    return () => clearTimeout(t);
  }, []);
  const mark = window.__resources && window.__resources.wordmark || "../../assets/logo/spal-wordmark.webp";
  return /*#__PURE__*/React.createElement("div", {
    "data-theme": "night",
    style: {
      height: "100%",
      position: "relative",
      overflow: "hidden",
      background: "#0B100E",
      color: "var(--text-primary)"
    }
  }, /*#__PURE__*/React.createElement(Aura, {
    variant: "night",
    intensity: splash ? 0.6 : 1
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity: splash ? 1 : 0,
      transition: "opacity 560ms var(--ease-out)",
      pointerEvents: "none"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: mark,
    alt: "SPAL",
    style: {
      width: 132,
      filter: "brightness(0) invert(1)",
      opacity: 0.94
    }
  })), !splash && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      padding: "0 24px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "enter",
    style: {
      paddingTop: 64,
      display: "flex",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: mark,
    alt: "SPAL",
    style: {
      width: 72,
      filter: "brightness(0) invert(1)",
      opacity: 0.9
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "enter",
    style: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      animationDelay: "60ms"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: 220,
      height: 220,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(SpalSymbol, {
    symbol: "profit",
    size: 200,
    color: "#EEF1ED",
    accent: "#6CC796"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      paddingBottom: 40
    }
  }, /*#__PURE__*/React.createElement("h1", {
    className: "enter",
    style: {
      margin: 0,
      textAlign: "center",
      fontSize: 34,
      fontWeight: 500,
      letterSpacing: "-0.028em",
      lineHeight: 1.08,
      animationDelay: "120ms"
    }
  }, "Your business finance made easy"), /*#__PURE__*/React.createElement("p", {
    className: "enter",
    style: {
      margin: "14px auto 32px",
      maxWidth: 300,
      textAlign: "center",
      color: "var(--text-secondary)",
      fontSize: 15,
      lineHeight: 1.5,
      animationDelay: "150ms"
    }
  }, "Track your sales, know your profit and grow. No accounting knowledge needed."), /*#__PURE__*/React.createElement("div", {
    className: "enter",
    style: {
      animationDelay: "180ms"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    fullWidth: true,
    onClick: onGetStarted
  }, "Get started"), /*#__PURE__*/React.createElement("button", {
    onClick: onLogin,
    style: {
      width: "100%",
      marginTop: 14,
      height: 44,
      background: "none",
      border: "none",
      fontSize: 14,
      color: "var(--text-secondary)",
      cursor: "pointer",
      fontFamily: "var(--font-display)"
    }
  }, "Already have an account? ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-primary)",
      fontWeight: 500
    }
  }, "Log in"))))));
}
window.WelcomeScreen = WelcomeScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile-app/WelcomeScreen.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Aura = __ds_scope.Aura;

__ds_ns.SpalSymbol = __ds_scope.SpalSymbol;

__ds_ns.SparkAvatar = __ds_scope.SparkAvatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Money = __ds_scope.Money;

__ds_ns.PillChip = __ds_scope.PillChip;

__ds_ns.InsightCard = __ds_scope.InsightCard;

__ds_ns.Skeleton = __ds_scope.Skeleton;

__ds_ns.SkeletonRow = __ds_scope.SkeletonRow;

__ds_ns.UndoToast = __ds_scope.UndoToast;

__ds_ns.WeeklyChallengeCard = __ds_scope.WeeklyChallengeCard;

__ds_ns.BottomNav = __ds_scope.BottomNav;

__ds_ns.QuickMenuFab = __ds_scope.QuickMenuFab;

__ds_ns.TopNavPills = __ds_scope.TopNavPills;

})();
