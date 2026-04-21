import { useState, useMemo } from "react";
import { useLang } from "./lib/LanguageContext";

const RESULT_LABELS = { WIN: "Gagné", LOSS: "Perdu", VOID: "Annulé" };
const RESULT_STYLES = {
  WIN:  "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  LOSS: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  VOID: "border-white/10 bg-white/[0.04] text-white/40",
};

/* ── Bankroll chart ── */
function BankrollChart({ bets }) {
  const evaluated = useMemo(() =>
    bets
      .filter((b) => b.result && b.result !== "VOID" && b.profit != null && b.created_at)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
  [bets]);

  if (evaluated.length < 2) return null;

  let running = 0;
  const points = [0, ...evaluated.map((b) => { running += b.profit; return running; })];
  const last = points[points.length - 1];

  const W = 600, H = 120;
  const PL = 36, PR = 12, PT = 12, PB = 20;
  const iW = W - PL - PR, iH = H - PT - PB;

  const minP = Math.min(0, ...points);
  const maxP = Math.max(0, ...points);
  const range = Math.max(maxP - minP, 1);

  const px = (i) => PL + (i / (points.length - 1)) * iW;
  const py = (v) => PT + iH - ((v - minP) / range) * iH;
  const zeroY = py(0);

  const linePath  = points.map((v, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(" ");
  const fillPath  = `${linePath} L${px(points.length - 1).toFixed(1)},${zeroY.toFixed(1)} L${px(0).toFixed(1)},${zeroY.toFixed(1)} Z`;
  const isPos     = last >= 0;
  const color     = isPos ? "#10b981" : "#ef4444";
  const fillColor = isPos ? "rgba(16,185,129,0.10)" : "rgba(239,68,68,0.10)";

  return (
    <div className="rounded-xl border border-white/8 bg-[#111e2b] p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-white/30">Évolution du profit</p>
        <p className={`text-sm font-bold tabular-nums ${isPos ? "text-emerald-300" : "text-rose-300"}`}>
          {last > 0 ? "+" : ""}{last.toFixed(2)} €
        </p>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 110 }}>
        {/* Zero line */}
        <line x1={PL} y1={zeroY} x2={W - PR} y2={zeroY}
          stroke="rgba(255,255,255,0.10)" strokeWidth="1" strokeDasharray="5 4" />
        {/* Fill */}
        <path d={fillPath} fill={fillColor} />
        {/* Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="2"
          strokeLinejoin="round" strokeLinecap="round" />
        {/* End dot */}
        <circle cx={px(points.length - 1)} cy={py(last)} r="3.5" fill={color} />
        {/* Y labels */}
        {[...new Set([minP, 0, maxP])].map((v) => (
          <text key={v} x={PL - 4} y={py(v) + 3.5} textAnchor="end"
            fill="rgba(255,255,255,0.28)" fontSize="9" fontFamily="monospace">
            {v > 0 ? "+" : ""}{v.toFixed(0)}€
          </text>
        ))}
        {/* Start / end labels */}
        <text x={PL} y={H - 2} fill="rgba(255,255,255,0.20)" fontSize="8.5">Début</text>
        <text x={W - PR} y={H - 2} textAnchor="end" fill="rgba(255,255,255,0.20)" fontSize="8.5">Maintenant</text>
      </svg>
      <p className="mt-1 text-[10px] text-white/25">{evaluated.length} paris évalués</p>
    </div>
  );
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? "border-emerald-500/20 bg-emerald-500/8" : "border-white/8 bg-[#111e2b]"}`}>
      <p className="text-[9px] uppercase tracking-widest text-white/30">{label}</p>
      <p className={`mt-1.5 text-2xl font-bold tabular-nums ${accent ? "text-emerald-300" : "text-white"}`}>{value ?? "—"}</p>
      {sub && <p className="mt-0.5 text-[10px] text-white/30">{sub}</p>}
    </div>
  );
}

export default function CarnetTab({ bets, loading, onUpdateResult, onDelete, onAutoEvaluate }) {
  const { t } = useLang();
  const tc = t.carnet;
  const [filter, setFilter]       = useState("ALL");
  const [evaluating, setEvaluating] = useState(false);
  const [evalMsg, setEvalMsg]     = useState("");

  async function handleAutoEvaluate() {
    setEvaluating(true);
    setEvalMsg("");
    const { evaluated } = await onAutoEvaluate();
    setEvalMsg(evaluated > 0 ? tc.auto_msg_ok(evaluated) : tc.auto_msg_none);
    setEvaluating(false);
  }

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
        <h3 className="text-lg font-semibold text-white">{tc.empty_title}</h3>
        <p className="mt-2 text-sm text-white/40">{tc.empty_desc}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={tc.total_bets} value={stats.total}   sub={tc.pending_sub(stats.pending)} />
        <StatCard label={tc.win_rate}  value={stats.winRate} sub={tc.won_sub(stats.wins)} accent />
        <StatCard label={tc.net_profit} value={stats.profit != null ? `${stats.profit > 0 ? "+" : ""}${stats.profit} €` : null} accent={stats.profit > 0} />
        <StatCard label={tc.roi}       value={stats.roi} sub={tc.roi_sub} accent={parseFloat(stats.roi) > 0} />
      </div>

      {/* Courbe de bankroll */}
      <BankrollChart bets={bets} />

      {/* Auto-évaluation */}
      {bets.some((b) => !b.result) && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-4 py-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-white/80">{tc.auto_eval}</p>
            <p className="text-xs text-white/35">{tc.auto_eval_sub}</p>
            {evalMsg && <p className="mt-1 text-xs text-emerald-400">{evalMsg}</p>}
          </div>
          <button
            onClick={handleAutoEvaluate}
            disabled={evaluating}
            className="btn-green shrink-0 rounded-lg px-4 py-2 text-sm font-semibold text-white"
          >
            {evaluating ? tc.evaluating : tc.auto_evaluate}
          </button>
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap gap-1.5">
        {[["ALL", tc.filter_all], ["PENDING", tc.filter_pending], ["WIN", tc.filter_won], ["LOSS", tc.filter_lost], ["VOID", tc.filter_void]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              filter === v ? "border-emerald-500/35 bg-emerald-500/12 text-emerald-300" : "border-white/8 bg-white/[0.04] text-white/40 hover:text-white/70"
            }`}>{l}</button>
        ))}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-white/30">{tc.no_filter}</p>
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

const API_BASE = "https://web-production-4b111.up.railway.app";

function evaluatePick(pick, result) {
  const { home_score: h, away_score: a, real_total_goals: t, real_btts: btts, real_over_2_5: over25, over_1_5: over15 } = result;
  const real1x2 = h > a ? "1" : h < a ? "2" : "X";
  switch (pick) {
    case "1":        return real1x2 === "1" ? "WIN" : "LOSS";
    case "X":        return real1x2 === "X" ? "WIN" : "LOSS";
    case "2":        return real1x2 === "2" ? "WIN" : "LOSS";
    case "BTTS":     return btts === 1 ? "WIN" : "LOSS";
    case "Over 1.5": return (over15 === 1 || t > 1) ? "WIN" : "LOSS";
    case "Over 2.5": return (over25 === 1 || t > 2) ? "WIN" : "LOSS";
    default:         return null;
  }
}

const LEG_RESULT_STYLES = {
  WIN:  "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  LOSS: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  null: "border-white/8 bg-white/[0.04] text-white/25",
};

function BetRow({ bet, onUpdateResult, onDelete }) {
  const { t } = useLang();
  const tc = t.carnet;
  const [open, setOpen]         = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkMsg, setCheckMsg] = useState("");

  const isMultiple     = bet.type === "multiple" && Array.isArray(bet.legs);
  const potentialProfit = bet.odds && bet.stake
    ? parseFloat(((bet.odds - 1) * bet.stake).toFixed(2))
    : null;

  async function handleCheckNow() {
    setChecking(true);
    setCheckMsg("");
    try {
      if (isMultiple) {
        const checked = [];
        for (const leg of bet.legs) {
          const res  = await fetch(`${API_BASE}/results/match?home=${encodeURIComponent(leg.match_home)}&away=${encodeURIComponent(leg.match_away)}`);
          const data = await res.json();
          if (!data.found || !data.finished) { checked.push({ result: null }); continue; }
          checked.push({ result: evaluatePick(leg.pick, data), score: `${data.home_score}-${data.away_score}` });
        }
        const pending = checked.filter((c) => !c.result).length;
        if (pending > 0) { setCheckMsg(`${pending} sélection(s) pas encore terminée(s) ou non trouvée(s).`); return; }
        const overall = checked.some((c) => c.result === "LOSS") ? "LOSS" : "WIN";
        await onUpdateResult(bet.id, overall);
        setCheckMsg(checked.map((c, i) => `S${i + 1} ${c.score} ${c.result === "WIN" ? "✓" : "✗"}`).join("  ") + ` → ${overall === "WIN" ? "Gagné ✓" : "Perdu ✗"}`);
      } else {
        const res  = await fetch(`${API_BASE}/results/match?home=${encodeURIComponent(bet.match_home)}&away=${encodeURIComponent(bet.match_away)}`);
        const data = await res.json();
        if (!data.found)    { setCheckMsg("Match non trouvé dans TheSportsDB."); return; }
        if (!data.finished) { setCheckMsg(`Match pas encore terminé (${data.status}).`); return; }
        const result = evaluatePick(bet.pick, data);
        if (result) {
          await onUpdateResult(bet.id, result);
          setCheckMsg(`Score : ${data.home_score}-${data.away_score} → ${result === "WIN" ? "Gagné ✓" : "Perdu ✗"}`);
        } else {
          setCheckMsg("Impossible d'évaluer ce type de pari automatiquement.");
        }
      }
    } catch { setCheckMsg("Erreur lors de la vérification."); }
    finally   { setChecking(false); }
  }

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
          {bet.result ? RESULT_LABELS[bet.result].slice(0, 3) : "…"}
        </div>

        {/* Match / titre */}
        <div className="min-w-0 flex-1">
          {isMultiple ? (
            <>
              <p className="truncate text-sm font-medium text-white/88">
                {tc.multiple_label} <span className="text-white/40">· {bet.legs.length} {tc.sels}</span>
              </p>
              <p className="text-xs text-white/35">
                {bet.odds ? `cote ${bet.odds}` : ""}{bet.stake ? ` · mise ${bet.stake} €` : ""}
              </p>
            </>
          ) : (
            <>
              <p className="truncate text-sm font-medium text-white/88">
                {bet.match_home} vs {bet.match_away}
              </p>
              <p className="text-xs text-white/35">
                {bet.pick} {bet.odds ? `· cote ${bet.odds}` : ""} {bet.stake ? `· mise ${bet.stake} €` : ""}
              </p>
            </>
          )}
        </div>

        {/* Profit */}
        <div className="shrink-0 text-right">
          {bet.result === "WIN"  && <p className="text-sm font-bold text-emerald-300">+{bet.profit} €</p>}
          {bet.result === "LOSS" && <p className="text-sm font-bold text-rose-300">{bet.profit} €</p>}
          {!bet.result && potentialProfit && <p className="text-xs text-white/30">+{potentialProfit} € si gagné</p>}
        </div>

        <svg className={`h-4 w-4 shrink-0 text-white/20 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {open && (
        <div className="border-t border-white/[0.06] px-4 py-3 space-y-3">

          {/* Legs pour pari multiple */}
          {isMultiple && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-widest text-white/25">{tc.selections}</p>
              {bet.legs.map((leg, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                  <div className={`flex h-6 w-8 shrink-0 items-center justify-center rounded border text-[9px] font-bold ${LEG_RESULT_STYLES[leg.result ?? null]}`}>
                    {leg.result ? RESULT_LABELS[leg.result].slice(0, 3) : "…"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-white/70">{leg.match_home} vs {leg.match_away}</p>
                    <p className="text-[10px] text-white/30">{leg.pick}{leg.odds ? ` · ${leg.odds}` : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Détails simples */}
          {!isMultiple && (
            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              {bet.match_date  && <div><p className="text-white/30">Date</p><p className="text-white/70">{bet.match_date}</p></div>}
              {bet.competition && <div><p className="text-white/30">Compétition</p><p className="text-white/70 truncate">{bet.competition}</p></div>}
              {bet.scoriq_pick && <div><p className="text-white/30">ScorIQ disait</p><p className="text-emerald-400">{bet.scoriq_pick} · {bet.scoriq_confidence ? `${Math.round(bet.scoriq_confidence * 100)}%` : ""}</p></div>}
            </div>
          )}

          {bet.notes && <p className="text-xs text-white/40 italic">"{bet.notes}"</p>}

          {/* Actions résultat */}
          {!bet.result && (
            <div className="flex flex-wrap gap-2">
              <p className="w-full text-[10px] uppercase tracking-widest text-white/25">
                {isMultiple ? tc.result_multiple : tc.result_single}
              </p>
              <button onClick={() => onUpdateResult(bet.id, "WIN")}  className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20">✓ {tc.won}</button>
              <button onClick={() => onUpdateResult(bet.id, "LOSS")} className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20">✗ {tc.lost}</button>
              <button onClick={() => onUpdateResult(bet.id, "VOID")} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/40 transition hover:bg-white/[0.08]">{tc.void}</button>
              <button
                onClick={handleCheckNow}
                disabled={checking}
                className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/20 disabled:opacity-50"
              >
                {checking ? tc.checking : tc.check_now}
              </button>
              {checkMsg && <p className="w-full text-xs text-sky-400">{checkMsg}</p>}
            </div>
          )}

          <div className="flex items-center gap-4">
            {bet.result && (
              <button onClick={() => onUpdateResult(bet.id, null)} className="text-[10px] text-white/20 transition hover:text-amber-300">
                {tc.withdraw_result}
              </button>
            )}
            <button onClick={() => onDelete(bet.id)} className="text-[10px] text-white/20 transition hover:text-rose-300">
              {tc.delete}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
