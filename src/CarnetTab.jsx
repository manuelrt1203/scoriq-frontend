import { useState } from "react";

const RESULT_LABELS = { WIN: "Gagné", LOSS: "Perdu", VOID: "Annulé" };
const RESULT_STYLES = {
  WIN:  "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  LOSS: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  VOID: "border-white/10 bg-white/[0.04] text-white/40",
};

function StatCard({ label, value, sub, accent }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? "border-emerald-500/20 bg-emerald-500/8" : "border-white/8 bg-[#111e2b]"}`}>
      <p className="text-[9px] uppercase tracking-widest text-white/30">{label}</p>
      <p className={`mt-1.5 text-2xl font-bold tabular-nums ${accent ? "text-emerald-300" : "text-white"}`}>{value ?? "—"}</p>
      {sub && <p className="mt-0.5 text-[10px] text-white/30">{sub}</p>}
    </div>
  );
}

export default function CarnetTab({ bets, loading, onUpdateResult, onDelete }) {
  const [filter, setFilter] = useState("ALL");

  const filtered = bets.filter((b) => filter === "ALL" ? true : b.result === filter || (filter === "PENDING" && !b.result));

  const stats = (() => {
    const evaluated = bets.filter((b) => b.result && b.result !== "VOID");
    const wins      = evaluated.filter((b) => b.result === "WIN").length;
    const profit    = bets.reduce((s, b) => s + (b.profit || 0), 0);
    const staked    = bets.filter((b) => b.stake).reduce((s, b) => s + parseFloat(b.stake), 0);
    return {
      total: bets.length,
      wins,
      winRate: evaluated.length ? `${Math.round(wins / evaluated.length * 100)}%` : null,
      profit: parseFloat(profit.toFixed(2)),
      roi: staked ? `${parseFloat((profit / staked * 100).toFixed(1))}%` : null,
      pending: bets.filter((b) => !b.result).length,
    };
  })();

  if (loading) {
    return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="shimmer h-20 rounded-xl" />)}</div>;
  }

  if (bets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/12 bg-white/[0.02] px-8 py-16 text-center">
        <p className="text-2xl mb-3">📒</p>
        <h3 className="text-lg font-semibold text-white">Carnet vide</h3>
        <p className="mt-2 text-sm text-white/40">Clique sur le bouton <strong className="text-white/60">+</strong> à côté d'un match pour enregistrer ton premier pari.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Paris total"  value={stats.total}   sub={`${stats.pending} en attente`} />
        <StatCard label="Taux de réussite" value={stats.winRate} sub={`${stats.wins} gagnés`} accent />
        <StatCard label="Profit net"   value={stats.profit != null ? `${stats.profit > 0 ? "+" : ""}${stats.profit} €` : null} accent={stats.profit > 0} />
        <StatCard label="ROI"          value={stats.roi} sub="retour sur mise" accent={parseFloat(stats.roi) > 0} />
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-1.5">
        {[["ALL","Tous"], ["PENDING","En attente"], ["WIN","Gagnés"], ["LOSS","Perdus"], ["VOID","Annulés"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              filter === v ? "border-emerald-500/35 bg-emerald-500/12 text-emerald-300" : "border-white/8 bg-white/[0.04] text-white/40 hover:text-white/70"
            }`}>{l}</button>
        ))}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-white/30">Aucun pari pour ce filtre.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((bet) => (
            <BetRow key={bet.id} bet={bet} onUpdateResult={onUpdateResult} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function BetRow({ bet, onUpdateResult, onDelete }) {
  const [open, setOpen] = useState(false);

  const potentialProfit = bet.odds && bet.stake
    ? parseFloat(((bet.odds - 1) * bet.stake).toFixed(2))
    : null;

  return (
    <div className="overflow-hidden rounded-xl border border-white/8 bg-[#111e2b]">
      <div
        className="flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-white/[0.03]"
        onClick={() => setOpen(!open)}
      >
        {/* Résultat badge */}
        <div className={`flex h-10 w-12 shrink-0 items-center justify-center rounded-lg border text-[11px] font-bold ${
          bet.result ? RESULT_STYLES[bet.result] : "border-white/8 bg-white/[0.04] text-white/30"
        }`}>
          {bet.result ? RESULT_LABELS[bet.result].slice(0,3) : "…"}
        </div>

        {/* Match */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white/88">
            {bet.match_home} vs {bet.match_away}
          </p>
          <p className="text-xs text-white/35">
            {bet.pick} {bet.odds ? `· cote ${bet.odds}` : ""} {bet.stake ? `· mise ${bet.stake} €` : ""}
          </p>
        </div>

        {/* Profit */}
        <div className="shrink-0 text-right">
          {bet.result === "WIN" && <p className="text-sm font-bold text-emerald-300">+{bet.profit} €</p>}
          {bet.result === "LOSS" && <p className="text-sm font-bold text-rose-300">{bet.profit} €</p>}
          {!bet.result && potentialProfit && <p className="text-xs text-white/30">+{potentialProfit} € si gagné</p>}
        </div>

        <svg className={`h-4 w-4 shrink-0 text-white/20 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {open && (
        <div className="border-t border-white/[0.06] px-4 py-3 space-y-3">
          {/* Détails */}
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            {bet.match_date && <div><p className="text-white/30">Date</p><p className="text-white/70">{bet.match_date}</p></div>}
            {bet.competition && <div><p className="text-white/30">Compétition</p><p className="text-white/70 truncate">{bet.competition}</p></div>}
            {bet.scoriq_pick && <div><p className="text-white/30">ScorIQ disait</p><p className="text-emerald-400">{bet.scoriq_pick} · {bet.scoriq_confidence ? `${Math.round(bet.scoriq_confidence * 100)}%` : ""}</p></div>}
            {bet.notes && <div className="col-span-2"><p className="text-white/30">Note</p><p className="text-white/70">{bet.notes}</p></div>}
          </div>

          {/* Actions résultat */}
          {!bet.result && (
            <div className="flex flex-wrap gap-2">
              <p className="w-full text-[10px] uppercase tracking-widest text-white/25">Résultat du match</p>
              <button onClick={() => onUpdateResult(bet.id, "WIN")}  className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20">✓ Gagné</button>
              <button onClick={() => onUpdateResult(bet.id, "LOSS")} className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20">✗ Perdu</button>
              <button onClick={() => onUpdateResult(bet.id, "VOID")} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/40 transition hover:bg-white/[0.08]">Annulé</button>
            </div>
          )}

          <button onClick={() => onDelete(bet.id)} className="text-[10px] text-white/20 transition hover:text-rose-300">
            Supprimer ce pari
          </button>
        </div>
      )}
    </div>
  );
}
