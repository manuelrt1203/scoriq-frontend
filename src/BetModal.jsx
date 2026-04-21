import { useState, useRef, useEffect } from "react";
import { useLang } from "./lib/LanguageContext";

const PICKS = [
  { value: "1",        label: "1 — Victoire dom." },
  { value: "X",        label: "X — Match nul" },
  { value: "2",        label: "2 — Victoire ext." },
  { value: "BTTS",     label: "BTTS — Les deux marquent" },
  { value: "Over 1.5", label: "Over 1.5 buts" },
  { value: "Over 2.5", label: "Over 2.5 buts" },
];

function newLeg(match = null) {
  return {
    match_home:        match?.home_team         || "",
    match_away:        match?.away_team         || "",
    match_date:        match?.date              || null,
    competition:       match?.competition_name  || null,
    pick:              match?.top_pick          || "1",
    odds:              "",
    scoriq_pick:       match?.top_pick          || null,
    scoriq_confidence: match?.confidence        || null,
    result:            null,
  };
}

function legFromMatch(m) {
  return {
    match_home:        m.home_team,
    match_away:        m.away_team,
    match_date:        m.date              || null,
    competition:       m.competition_name  || null,
    pick:              m.top_pick          || "1",
    odds:              "",
    scoriq_pick:       m.top_pick          || null,
    scoriq_confidence: m.confidence        || null,
    result:            null,
  };
}

function MatchPicker({ allMatches, leg, excluded = [], onSelect }) {
  const { t }             = useLang();
  const tb                = t.bet;
  const [open,  setOpen]  = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filtered = (allMatches || []).filter((m) => {
    if (excluded.some((e) => e.home_team === m.home_team && e.away_team === m.away_team)) return false;
    const q = query.toLowerCase();
    return !q || m.home_team.toLowerCase().includes(q) || m.away_team.toLowerCase().includes(q);
  }).slice(0, 20);

  const hasMatch = leg.match_home && leg.match_away;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(!open); setQuery(""); }}
        className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition ${
          hasMatch
            ? "border-emerald-500/20 bg-emerald-500/5 text-white/80"
            : "border-white/10 bg-white/[0.05] text-white/30 hover:border-white/20"
        }`}
      >
        {hasMatch ? `${leg.match_home} vs ${leg.match_away}` : tb.choose}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-white/10 bg-[#0d1520] shadow-2xl">
          <div className="p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tb.search}
              className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-white placeholder:text-white/25 outline-none focus:border-emerald-500/40"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-white/25">{tb.no_match}</p>
            ) : filtered.map((m, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => { onSelect(m); setOpen(false); }}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left text-xs transition hover:bg-white/[0.06]"
              >
                <span className="text-white/80">{m.home_team} <span className="text-white/30">vs</span> {m.away_team}</span>
                {m.top_pick && (
                  <span className="ml-2 shrink-0 rounded border border-emerald-500/20 bg-emerald-500/8 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                    {m.top_pick}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BetModal({ match, allMatches = [], onAdd, onClose }) {
  const { t } = useLang();
  const tb = t.bet;
  const [mode, setMode] = useState("simple");

  // Simple
  const [pick,  setPick]  = useState(match?.top_pick || "1");
  const [odds,  setOdds]  = useState("");
  const [stake, setStake] = useState("");
  const [notes, setNotes] = useState("");

  // Multiple
  const [legs,       setLegs]       = useState([newLeg(match)]);
  const [multiStake, setMultiStake] = useState("");
  const [multiNotes, setMultiNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const combinedOdds = legs.reduce((acc, l) => {
    const o = parseFloat(l.odds);
    return o > 1 ? parseFloat((acc * o).toFixed(4)) : acc;
  }, 1);
  const allLegsHaveOdds = legs.every((l) => parseFloat(l.odds) > 1);

  function updateLeg(i, field, value) {
    setLegs((prev) => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  }

  function selectMatchForLeg(i, m) {
    setLegs((prev) => prev.map((l, idx) => idx === i ? { ...legFromMatch(m), odds: l.odds } : l));
  }

  function addLeg() { setLegs((prev) => [...prev, newLeg()]); }
  function removeLeg(i) { setLegs((prev) => prev.filter((_, idx) => idx !== i)); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    let err;
    if (mode === "simple") {
      err = await onAdd({
        type:              "simple",
        match_home:        match.home_team,
        match_away:        match.away_team,
        match_date:        match.date              || null,
        competition:       match.competition_name  || null,
        pick,
        odds:              odds  ? parseFloat(odds)  : null,
        stake:             stake ? parseFloat(stake) : null,
        notes:             notes || null,
        scoriq_pick:       match.top_pick    || null,
        scoriq_confidence: match.confidence  || null,
        legs:              null,
      });
    } else {
      if (legs.length < 2) {
        setError(tb.err_min_legs);
        setSaving(false); return;
      }
      if (legs.some((l) => !l.match_home.trim() || !l.match_away.trim())) {
        setError(tb.err_fill_teams);
        setSaving(false); return;
      }
      err = await onAdd({
        type:              "multiple",
        match_home:        legs[0].match_home,
        match_away:        legs[0].match_away,
        match_date:        legs[0].match_date  || null,
        competition:       legs[0].competition || null,
        pick:              null,
        odds:              allLegsHaveOdds ? parseFloat(combinedOdds.toFixed(2)) : null,
        stake:             multiStake ? parseFloat(multiStake) : null,
        notes:             multiNotes || null,
        scoriq_pick:       null,
        scoriq_confidence: null,
        legs:              legs.map((l) => ({ ...l, odds: l.odds ? parseFloat(l.odds) : null })),
      });
    }

    setSaving(false);
    if (err) setError(err.message);
    else onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111e2b] shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/8 bg-[#111e2b] px-5 py-4">
          <div>
            <h2 className="font-semibold text-white">{tb.title}</h2>
            <p className="mt-0.5 text-xs text-white/40">{match.home_team} vs {match.away_team}</p>
          </div>
          <button onClick={onClose} className="text-white/30 transition hover:text-white/70">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mode toggle */}
        <div className="mx-5 mt-4 flex gap-1 rounded-xl border border-white/8 bg-white/[0.03] p-1">
          {[["simple", tb.simple], ["multiple", tb.multiple]].map(([v, l]) => (
            <button key={v} type="button" onClick={() => { setMode(v); setError(""); }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                mode === v ? "bg-emerald-500/20 text-emerald-300" : "text-white/40 hover:text-white/70"
              }`}>
              {l}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">

          {mode === "simple" ? (
            <>
              {match.top_pick && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/8 px-3 py-2">
                  <span className="text-[10px] uppercase tracking-widest text-emerald-400/60">ScorIQ</span>
                  <span className="text-sm font-semibold text-emerald-300">
                    {match.top_pick === "1" ? `1 — ${match.home_team}` : match.top_pick === "2" ? `2 — ${match.away_team}` : "X — Nul"}
                  </span>
                  {match.confidence && (
                    <span className="ml-auto text-xs text-emerald-400/60">{Math.round(match.confidence * 100)}%</span>
                  )}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">{tb.my_bet}</label>
                <select value={pick} onChange={(e) => setPick(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#0d1520] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/40">
                  {PICKS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">{tb.odds}</label>
                  <input type="number" step="0.01" min="1" value={odds} onChange={(e) => setOdds(e.target.value)}
                    placeholder="ex: 1.85"
                    className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-emerald-500/40" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">{tb.stake}</label>
                  <input type="number" step="0.5" min="0" value={stake} onChange={(e) => setStake(e.target.value)}
                    placeholder="ex: 10"
                    className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-emerald-500/40" />
                </div>
              </div>

              {odds && stake && (
                <p className="text-xs text-white/40">
                  {tb.potential} : <span className="font-semibold text-emerald-300">+{((parseFloat(odds) - 1) * parseFloat(stake)).toFixed(2)} €</span>
                </p>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">{tb.note}</label>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder={tb.note_ph}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-emerald-500/40" />
              </div>
            </>
          ) : (
            <>
              {/* Legs */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-white/50">Sélections ({legs.length})</p>
                {legs.map((leg, i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-white/[0.03] p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/25">Sélection {i + 1}</span>
                      {i > 0 && (
                        <button type="button" onClick={() => removeLeg(i)} className="text-[10px] text-white/20 transition hover:text-rose-300">
                          Retirer
                        </button>
                      )}
                    </div>

                    {/* Match selector */}
                    {i === 0 ? (
                      <div className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-white/50">
                        {leg.match_home} vs {leg.match_away}
                        <span className="ml-2 text-white/25">(match courant)</span>
                      </div>
                    ) : (
                      <MatchPicker
                        allMatches={allMatches}
                        leg={leg}
                        excluded={[
                          { home_team: match.home_team, away_team: match.away_team },
                          ...legs
                            .filter((_, idx) => idx !== i && legs[idx].match_home)
                            .map((l) => ({ home_team: l.match_home, away_team: l.match_away })),
                        ]}
                        onSelect={(m) => selectMatchForLeg(i, m)}
                      />
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <select value={leg.pick} onChange={(e) => updateLeg(i, "pick", e.target.value)}
                        className="rounded-lg border border-white/10 bg-[#0d1520] px-2.5 py-2 text-xs text-white outline-none focus:border-emerald-500/40">
                        {PICKS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                      <input type="number" step="0.01" min="1" value={leg.odds}
                        onChange={(e) => updateLeg(i, "odds", e.target.value)}
                        placeholder="Cote"
                        className="rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-2 text-xs text-white placeholder:text-white/20 outline-none focus:border-emerald-500/40" />
                    </div>

                    {leg.scoriq_pick && (
                      <p className="text-[10px] text-emerald-400/60">
                        ScorIQ : {leg.scoriq_pick}{leg.scoriq_confidence ? ` · ${Math.round(leg.scoriq_confidence * 100)}%` : ""}
                      </p>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addLeg}
                  className="w-full rounded-xl border border-dashed border-white/12 py-2.5 text-xs text-white/30 transition hover:border-emerald-500/30 hover:text-emerald-400">
                  + Ajouter une sélection
                </button>
              </div>

              {/* Cote combinée */}
              {allLegsHaveOdds && legs.length >= 2 && (
                <div className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/8 px-4 py-2.5">
                  <span className="text-xs text-amber-400/70">Cote combinée ({legs.length} sél.)</span>
                  <span className="text-lg font-bold text-amber-300">{combinedOdds.toFixed(2)}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">{tb.stake}</label>
                  <input type="number" step="0.5" min="0" value={multiStake} onChange={(e) => setMultiStake(e.target.value)}
                    placeholder="ex: 10"
                    className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-emerald-500/40" />
                </div>
                <div className="flex items-end pb-2.5">
                  {allLegsHaveOdds && multiStake && (
                    <p className="text-xs text-white/40">
                      Gain : <span className="font-semibold text-emerald-300">+{((combinedOdds - 1) * parseFloat(multiStake)).toFixed(2)} €</span>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">{tb.note}</label>
                <input type="text" value={multiNotes} onChange={(e) => setMultiNotes(e.target.value)}
                  placeholder={tb.note_ph}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-emerald-500/40" />
              </div>
            </>
          )}

          {error && <p className="text-xs text-rose-300">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm text-white/50 transition hover:bg-white/[0.05]">
              {tb.cancel}
            </button>
            <button type="submit" disabled={saving} className="btn-green flex-1 rounded-lg py-2.5 text-sm font-semibold text-white">
              {saving ? tb.saving : tb.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
