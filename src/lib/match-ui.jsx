import { useState, useEffect } from "react";

export function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return `${(Number(value) * 100).toFixed(1)}%`;
}

export function formatGoals(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return Number(value).toFixed(2);
}

export function pickLabel(value) {
  if (value === "1") return "Victoire domicile";
  if (value === "X") return "Match nul";
  if (value === "2") return "Victoire extérieur";
  return "—";
}

export function trustMeta(trust) {
  if (trust === "FORTE") {
    return {
      badge: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
      text:  "text-emerald-300",
      dot:   "bg-emerald-400",
    };
  }
  if (trust === "MOYENNE") {
    return {
      badge: "bg-amber-500/15 text-amber-200 border-amber-400/25",
      text:  "text-amber-300",
      dot:   "bg-amber-400",
    };
  }
  if (trust === "FAIBLE") {
    return {
      badge: "bg-rose-500/15 text-rose-200 border-rose-400/25",
      text:  "text-rose-300",
      dot:   "bg-rose-400",
    };
  }
  return {
    badge: "bg-slate-500/12 text-slate-300 border-slate-400/20",
    text:  "text-slate-400",
    dot:   "bg-slate-500",
  };
}

function initials(name) {
  return String(name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

const SPINNER_SIZES = { xs: 12, sm: 16, md: 24, lg: 36 };

export function Spinner({ size = "sm", tone = "accent", className = "" }) {
  const px = SPINNER_SIZES[size] || SPINNER_SIZES.sm;
  return (
    <span
      className={`spinner-ring ${tone === "light" ? "spinner-ring-light" : ""} ${className}`}
      style={{ width: px, height: px }}
      role="status"
      aria-label="Chargement"
    />
  );
}

export function TeamLogo({ name, logo, size = "h-7 w-7" }) {
  const [failed, setFailed] = useState(false);

  if (logo && !failed) {
    return (
      <img
        src={logo}
        alt={name}
        className={`${size} rounded-md object-contain`}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div className={`${size} flex items-center justify-center rounded-lg bg-gradient-to-br from-[#1e2d3d] to-[#162130] text-[10px] font-bold text-white/50 ring-1 ring-white/[0.06]`}>
      {initials(name)}
    </div>
  );
}

export function ProbBar({ label, value, colorClass }) {
  const [started, setStarted] = useState(false);
  const width = Math.max(2, Math.min(100, Number(value || 0) * 100));

  useEffect(() => {
    const id = setTimeout(() => setStarted(true), 60);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/55">{label}</span>
        <span className="font-semibold text-white tabular-nums">{formatPercent(value)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className={`h-full rounded-full ${colorClass} transition-all duration-[850ms] ease-out`}
          style={{ width: started ? `${width}%` : "0%", boxShadow: started ? "0 0 10px rgba(255,255,255,0.2)" : "none" }}
        />
      </div>
    </div>
  );
}
