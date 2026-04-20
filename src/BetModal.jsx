import { useState } from "react";

const PICKS = [
  { value: "1",        label: "1 — Victoire dom." },
  { value: "X",        label: "X — Match nul" },
  { value: "2",        label: "2 — Victoire ext." },
  { value: "BTTS",     label: "BTTS — Les deux marquent" },
  { value: "Over 1.5", label: "Over 1.5 buts" },
  { value: "Over 2.5", label: "Over 2.5 buts" },
];

export default function BetModal({ match, onAdd, onClose }) {
  const [pick,  setPick]  = useState(match?.top_pick || "1");
  const [odds,  setOdds]  = useState("");
  const [stake, setStake] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const err = await onAdd({
      match_home:          match.home_team,
      match_away:          match.away_team,
      match_date:          match.date || null,
      competition:         match.competition_name || null,
      pick,
      odds:                odds ? parseFloat(odds) : null,
      stake:               stake ? parseFloat(stake) : null,
      notes:               notes || null,
      scoriq_pick:         match.top_pick || null,
      scoriq_confidence:   match.confidence || null,
    });
    setSaving(false);
    if (err) setError(err.message);
    else onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111e2b] shadow-2xl" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <div>
            <h2 className="font-semibold text-white">Enregistrer un pari</h2>
            <p className="mt-0.5 text-xs text-white/40">{match.home_team} vs {match.away_team}</p>
          </div>
          <button onClick={onClose} className="text-white/30 transition hover:text-white/70">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ScorIQ hint */}
        {match.top_pick && (
          <div className="mx-5 mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/8 px-3 py-2">
            <span className="text-[10px] uppercase tracking-widest text-emerald-400/60">ScorIQ</span>
            <span className="text-sm font-semibold text-emerald-300">
              {match.top_pick === "1" ? `1 — ${match.home_team}` : match.top_pick === "2" ? `2 — ${match.away_team}` : "X — Nul"}
            </span>
            {match.confidence && (
              <span className="ml-auto text-xs text-emerald-400/60">{Math.round(match.confidence * 100)}%</span>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">

          {/* Pick */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">Mon pari</label>
            <select
              value={pick}
              onChange={(e) => setPick(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#0d1520] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/40"
            >
              {PICKS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Odds + Stake */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50">Cote</label>
              <input
                type="number" step="0.01" min="1" value={odds}
                onChange={(e) => setOdds(e.target.value)}
                placeholder="ex: 1.85"
                className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-emerald-500/40"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50">Mise (€)</label>
              <input
                type="number" step="0.5" min="0" value={stake}
                onChange={(e) => setStake(e.target.value)}
                placeholder="ex: 10"
                className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-emerald-500/40"
              />
            </div>
          </div>

          {/* Gain potentiel */}
          {odds && stake && (
            <p className="text-xs text-white/40">
              Gain potentiel : <span className="font-semibold text-emerald-300">+{((parseFloat(odds) - 1) * parseFloat(stake)).toFixed(2)} €</span>
            </p>
          )}

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">Note (optionnel)</label>
            <input
              type="text" value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Raison du pari, remarques…"
              className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-emerald-500/40"
            />
          </div>

          {error && <p className="text-xs text-rose-300">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm text-white/50 transition hover:bg-white/[0.05]">
              Annuler
            </button>
            <button type="submit" disabled={saving} className="btn-green flex-1 rounded-lg py-2.5 text-sm font-semibold text-white">
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
