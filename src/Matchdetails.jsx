import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  formatGoals,
  formatPercent,
  pickLabel,
  trustMeta,
  TeamLogo,
  ProbBar,
} from "./lib/match-ui.jsx";

const BRAND  = "ScorIQ";
const SLOGAN = "L'IA qui voit les matchs autrement";

const API_BASE = "https://web-production-4b111.up.railway.app";

/* ─── Tête-à-tête ──────────────────────────────────────── */
function H2HSection({ homeTeam, awayTeam }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/h2h?home=${encodeURIComponent(homeTeam)}&away=${encodeURIComponent(awayTeam)}&limit=8`)
      .then(r => r.json())
      .then(data => { if (!cancelled) setMatches(Array.isArray(data) ? data : []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [homeTeam, awayTeam]);

  return (
    <div className="rounded-xl border border-white/8 bg-[#111e2b] p-5">
      <p className="text-[9px] uppercase tracking-[0.3em] text-white/30 mb-4">Tête-à-tête récent</p>
      {loading ? (
        <p className="text-sm text-white/30 animate-pulse">Chargement…</p>
      ) : !matches.length ? (
        <p className="text-sm text-white/30">Aucune confrontation trouvée.</p>
      ) : (
        <div className="space-y-2">
          {matches.map((m, i) => {
            const isOurHome = m.home === homeTeam;
            const gf = isOurHome ? m.home_score : m.away_score;
            const ga = isOurHome ? m.away_score : m.home_score;
            let outcome = "N";
            if (gf > ga) outcome = "V";
            else if (gf < ga) outcome = "D";
            const outcomeStyle = outcome === "V"
              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
              : outcome === "D"
              ? "border-rose-500/30 bg-rose-500/15 text-rose-300"
              : "border-white/15 bg-white/8 text-white/45";
            const dateStr = m.date ? m.date.slice(0, 10) : "";
            return (
              <div key={i} className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-2">
                <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${outcomeStyle}`}>
                  {outcome}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/70 truncate">
                    {m.home} {m.home_score}–{m.away_score} {m.away}
                  </p>
                  <p className="text-[10px] text-white/30">{dateStr} · {m.competition_name}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Classement ────────────────────────────────────────── */
function StandingsSection({ competitionName, homeTeam, awayTeam }) {
  const [table, setTable] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/standings?competition=${encodeURIComponent(competitionName)}`)
      .then(r => r.json())
      .then(data => { if (!cancelled) setTable(Array.isArray(data) ? data : []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [competitionName]);

  if (loading) return (
    <div className="rounded-xl border border-white/8 bg-[#111e2b] p-5">
      <p className="text-[9px] uppercase tracking-[0.3em] text-white/30 mb-4">Classement</p>
      <p className="text-sm text-white/30 animate-pulse">Chargement…</p>
    </div>
  );

  if (!table.length) return (
    <div className="rounded-xl border border-white/8 bg-[#111e2b] p-5">
      <p className="text-[9px] uppercase tracking-[0.3em] text-white/30 mb-4">Classement</p>
      <p className="text-sm text-white/30">Classement non disponible pour cette compétition.</p>
    </div>
  );

  const ht = homeTeam.toLowerCase();
  const at = awayTeam.toLowerCase();

  return (
    <div className="rounded-xl border border-white/8 bg-[#111e2b] p-5">
      <p className="text-[9px] uppercase tracking-[0.3em] text-white/30 mb-4">
        Classement — {competitionName}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/8 text-[9px] uppercase tracking-wider text-white/25">
              <th className="pb-2 text-center w-6">#</th>
              <th className="pb-2 text-left pl-1">Équipe</th>
              <th className="pb-2 text-center w-8">J</th>
              <th className="pb-2 text-center w-8">G</th>
              <th className="pb-2 text-center w-8">N</th>
              <th className="pb-2 text-center w-8">P</th>
              <th className="pb-2 text-center w-10">+/-</th>
              <th className="pb-2 text-center w-8 text-white/50">Pts</th>
            </tr>
          </thead>
          <tbody>
            {table.map((row, i) => {
              const name = (row.team || "").toLowerCase();
              const isHL = name === ht || name === at;
              return (
                <tr key={i} className={`border-b border-white/[0.04] ${isHL ? "bg-emerald-500/8" : ""}`}>
                  <td className="py-1.5 text-center text-white/30">{row.rank}</td>
                  <td className={`py-1.5 pl-1 max-w-[130px] truncate ${isHL ? "font-semibold text-emerald-300" : "text-white/65"}`}>
                    {row.team}
                  </td>
                  <td className="py-1.5 text-center text-white/45">{row.played}</td>
                  <td className="py-1.5 text-center text-white/45">{row.won}</td>
                  <td className="py-1.5 text-center text-white/45">{row.drawn}</td>
                  <td className="py-1.5 text-center text-white/45">{row.lost}</td>
                  <td className="py-1.5 text-center text-white/45">{row.gd}</td>
                  <td className="py-1.5 text-center font-bold text-white">{row.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Logo({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="dg1" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <path d="M20 1.5L36.5 10.5V28.5L20 37.5L3.5 28.5V10.5Z" fill="url(#dg1)" />
      <path d="M23.5 8.5L13 22.5H20.5L17.5 31.5L28 18H20.5Z" fill="white" fillOpacity="0.95" />
    </svg>
  );
}

function MetricCard({ label, value, note, delay = 0, accent = false }) {
  return (
    <div
      className={`anim-fade-up rounded-xl border p-4 ${
        accent
          ? "border-emerald-500/20 bg-emerald-500/8"
          : "border-white/8 bg-[#111e2b]"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-[9px] uppercase tracking-[0.3em] text-white/30">{label}</p>
      <p className={`mt-2 text-2xl font-bold tabular-nums ${accent ? "text-emerald-300" : "text-white"}`}>
        {value}
      </p>
      {note && <p className="mt-1 text-xs text-white/35">{note}</p>}
    </div>
  );
}

function explanation(match) {
  const h = Number(match?.proba_home_win || 0);
  const a = Number(match?.proba_away_win || 0);
  const d = Number(match?.proba_draw || 0);
  if (h > a && h > d) return `Le modèle penche vers ${match.home_team} avec un avantage statistique plus net sur l'issue principale.`;
  if (a > h && a > d) return `Le modèle voit ${match.away_team} légèrement au-dessus sur la dynamique du match.`;
  return "Le scénario reste serré, avec une forte résistance des deux côtés et une issue plus incertaine.";
}

function goalNote(match) {
  const t = Number(match?.pred_total_goals || 0);
  const b = Number(match?.btts_yes || 0);
  if (t >= 3) return "Le match s'annonce assez ouvert, avec un bon volume offensif attendu.";
  if (b >= 0.55) return "Les deux équipes ont de bonnes chances de marquer, même si le total reste modéré.";
  return "Le modèle attend un match plus fermé, avec moins d'explosions offensives.";
}

export default function MatchDetail() {
  const navigate   = useNavigate();
  const { state }  = useLocation();
  const match      = state?.match;

  if (!match) {
    return (
      <div className="flex h-screen flex-col bg-[#0d1520] text-white">
        {/* Nav bar */}
        <header className="flex h-[52px] items-center gap-3 border-b border-white/8 bg-[#091624] px-4">
          <Logo size={26} />
          <span className="brand-text text-lg font-bold">{BRAND}</span>
        </header>
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-md text-center">
            <p className="text-xs uppercase tracking-widest text-rose-300/70">Match introuvable</p>
            <h1 className="mt-3 text-2xl font-bold text-white">Aucune donnée transmise</h1>
            <p className="mt-3 text-sm text-white/45">
              Tu as probablement ouvert cette page directement sans passer par le tableau de bord.
            </p>
            <button
              onClick={() => navigate("/")}
              className="btn-green mt-6 rounded-lg px-6 py-2.5 text-sm font-semibold text-white"
            >
              Retour au tableau de bord
            </button>
          </div>
        </div>
      </div>
    );
  }

  const meta         = trustMeta(match.trust_level);
  const insufficient = match.status_prediction === "INSUFFICIENT_HISTORY";

  return (
    <div className="flex h-screen flex-col bg-[#0d1520] text-white overflow-hidden">

      {/* ── TOP NAV ── */}
      <header className="anim-slide-down flex h-[52px] shrink-0 items-center gap-3 border-b border-white/8 bg-[#091624] px-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/60 transition hover:bg-white/[0.06] hover:text-white/90"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Retour
        </button>

        <div className="flex items-center gap-2 ml-1">
          <Logo size={24} />
          <span className="brand-text text-base font-bold">{BRAND}</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => navigate("/", { state: { openBet: match } })}
            className="btn-green rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
          >
            Parier
          </button>
          <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${meta.badge}`}>
            {insufficient ? "Insuff." : match.trust_level || "—"}
          </span>
        </div>
      </header>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl space-y-5 p-4 md:p-6">

          {/* Match hero card */}
          <div className="anim-fade-up relative overflow-hidden rounded-xl border border-white/8 bg-[#111e2b] p-6">
            {/* Background glow */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/8 blur-3xl" />
              <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-blue-500/8 blur-3xl" />
            </div>

            <div className="relative">
              <p className="text-[10px] uppercase tracking-[0.35em] text-white/30">
                {match.competition_name || "Match"} · {match.date || "Date indisponible"}
              </p>

              <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* Teams — vertical sur mobile, horizontal sur desktop */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex items-center gap-3">
                    <TeamLogo name={match.home_team} logo={match.home_badge} size="h-12 w-12 sm:h-14 sm:w-14" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-white/30">Domicile</p>
                      <h1 className="text-lg font-bold text-white sm:text-2xl md:text-3xl">{match.home_team}</h1>
                    </div>
                  </div>

                  <div className="self-start sm:self-auto rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-bold tracking-[0.4em] text-white/35">
                    VS
                  </div>

                  <div className="flex items-center gap-3">
                    <TeamLogo name={match.away_team} logo={match.away_badge} size="h-12 w-12 sm:h-14 sm:w-14" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-white/30">Extérieur</p>
                      <h1 className="text-lg font-bold text-white sm:text-2xl md:text-3xl">{match.away_team}</h1>
                    </div>
                  </div>
                </div>

                {/* Score prediction — cohérent ou ambigu */}
                {match.score_coherent === false ? (
                  <div className="shrink-0 space-y-2 min-w-[180px]">
                    <div className="flex items-center justify-end gap-1.5 rounded-lg border border-amber-400/25 bg-amber-400/8 px-3 py-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 shrink-0">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-amber-300">Match ambigu</span>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-right">
                      <p className="text-[9px] uppercase tracking-[0.22em] text-white/30">Score global le + probable</p>
                      <p className="mt-1 text-2xl font-bold text-white/65 tabular-nums">{match.most_likely_score || "—"}</p>
                      <p className="text-xs text-white/25">{formatPercent(match.most_likely_score_prob)}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-4 py-3 text-right">
                      <p className="text-[9px] uppercase tracking-[0.22em] text-emerald-300/60">Si {pickLabel(match.top_pick)}</p>
                      <p className="mt-1 text-3xl font-bold text-white tabular-nums">{match.most_likely_score_for_pick || "—"}</p>
                      <p className="text-xs text-white/40">{formatPercent(match.most_likely_score_for_pick_prob)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="shrink-0 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-6 py-5 text-right">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-300/60">Score projeté</p>
                    <p className="mt-2 text-4xl font-bold text-white tabular-nums">{match.most_likely_score || "—"}</p>
                    <p className="mt-1 text-sm text-white/40">
                      Probabilité : {formatPercent(match.most_likely_score_prob)}
                    </p>
                  </div>
                )}
              </div>

              <p className="mt-5 text-sm leading-7 text-white/55">
                {insufficient
                  ? "Historique insuffisant pour produire un pronostic fiable sur ce match."
                  : explanation(match)}
              </p>
            </div>
          </div>

          {/* Metric cards */}
          {!insufficient && (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Pronostic principal" value={pickLabel(match.top_pick)}          note={`Confiance : ${formatPercent(match.confidence)}`} delay={0}   accent />
              <MetricCard label="Buts domicile"       value={formatGoals(match.pred_home_goals)} note={match.home_team}     delay={60} />
              <MetricCard label="Buts extérieur"      value={formatGoals(match.pred_away_goals)} note={match.away_team}     delay={120} />
              <MetricCard label="Total attendu"       value={formatGoals(match.pred_total_goals)} note="Volume offensif global" delay={180} />
            </div>
          )}

          {/* Probability + Goals charts */}
          {!insufficient && (
            <div className="anim-fade-up grid gap-4 xl:grid-cols-2" style={{ animationDelay: "150ms" }}>
              <div className="rounded-xl border border-white/8 bg-[#111e2b] p-5">
                <h2 className="text-sm font-semibold text-white/80">Répartition 1X2</h2>
                <p className="mt-1 text-xs text-white/35 mb-5">
                  Les trois scénarios pondérés par le modèle.
                </p>
                <div className="space-y-4">
                  <ProbBar label={`1 — ${match.home_team}`} value={match.proba_home_win} colorClass="bg-gradient-to-r from-emerald-400 to-emerald-500" />
                  <ProbBar label="X — Match nul"           value={match.proba_draw}     colorClass="bg-gradient-to-r from-amber-400 to-orange-500" />
                  <ProbBar label={`2 — ${match.away_team}`} value={match.proba_away_win} colorClass="bg-gradient-to-r from-rose-400 to-pink-500" />
                </div>
              </div>

              <div className="rounded-xl border border-white/8 bg-[#111e2b] p-5">
                <h2 className="text-sm font-semibold text-white/80">Marchés buts</h2>
                <p className="mt-1 text-xs text-white/35 mb-5">{goalNote(match)}</p>
                <div className="space-y-4">
                  <ProbBar label="Over 1.5" value={match.over_1_5} colorClass="bg-gradient-to-r from-sky-400 to-cyan-500" />
                  <ProbBar label="Over 2.5" value={match.over_2_5} colorClass="bg-gradient-to-r from-violet-400 to-fuchsia-500" />
                  <ProbBar label="BTTS"     value={match.btts_yes} colorClass="bg-gradient-to-r from-pink-400 to-rose-500" />
                </div>
              </div>
            </div>
          )}

          {/* Scénarios — Top 3 scores + cohérence */}
          {!insufficient && (
            <div className="anim-fade-up grid gap-4 xl:grid-cols-[1fr_1fr_1fr]" style={{ animationDelay: "220ms" }}>

              {/* Top 3 scores */}
              <div className="rounded-xl border border-white/8 bg-[#111e2b] p-5">
                <p className="text-[9px] uppercase tracking-[0.3em] text-white/30 mb-4">Top 3 scores les plus probables</p>
                <div className="space-y-2.5">
                  {(match.top3_scores || []).map(({ score, prob }, i) => {
                    const isForPick = score === match.most_likely_score_for_pick;
                    const isGlobal  = score === match.most_likely_score;
                    const width     = Math.round(prob * 100);
                    return (
                      <div key={score}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-base font-bold tabular-nums ${i === 0 ? "text-white" : "text-white/65"}`}>{score}</span>
                            {isGlobal && !isForPick && (
                              <span className="text-[9px] font-bold uppercase tracking-wide border border-white/15 text-white/40 rounded px-1.5 py-0.5">global</span>
                            )}
                            {isForPick && (
                              <span className="text-[9px] font-bold uppercase tracking-wide border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 rounded px-1.5 py-0.5">prédit</span>
                            )}
                          </div>
                          <span className={`text-xs tabular-nums font-semibold ${i === 0 ? "text-white/80" : "text-white/40"}`}>{(prob * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${i === 0 ? "bg-emerald-400" : i === 1 ? "bg-emerald-400/50" : "bg-emerald-400/25"}`}
                            style={{ width: `${Math.min(100, width * 6)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cohérence score vs prédiction */}
              <div className={`rounded-xl border p-5 ${match.score_coherent === false ? "border-amber-400/20 bg-amber-400/5" : "border-emerald-500/15 bg-emerald-500/5"}`}>
                <p className="text-[9px] uppercase tracking-[0.3em] text-white/30 mb-3">Cohérence score / résultat</p>
                {match.score_coherent === false ? (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-amber-400 text-lg">⚠</span>
                      <span className="text-sm font-semibold text-amber-300">Match ambigu</span>
                    </div>
                    <p className="text-xs text-white/50 leading-5">
                      Le score le plus probable toutes issues confondues
                      (<span className="font-bold text-white/75">{match.most_likely_score}</span>) ne correspond pas à la prédiction (<span className="font-bold text-white/75">{pickLabel(match.top_pick)}</span>).
                    </p>
                    <p className="mt-2 text-xs text-white/50 leading-5">
                      Le meilleur score cohérent avec la prédiction est <span className="font-bold text-white/75">{match.most_likely_score_for_pick}</span> ({formatPercent(match.most_likely_score_for_pick_prob)}).
                    </p>
                    <p className="mt-2 text-[10px] text-white/30 leading-5">
                      Les probabilités cumulées restent en faveur de {pickLabel(match.top_pick)}, mais le match est difficile à lire.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-emerald-400 text-lg">✓</span>
                      <span className="text-sm font-semibold text-emerald-300">Signal cohérent</span>
                    </div>
                    <p className="text-xs text-white/50 leading-5">
                      Le score le plus probable (<span className="font-bold text-white/75">{match.most_likely_score}</span>) est cohérent avec le résultat prédit (<span className="font-bold text-white/75">{pickLabel(match.top_pick)}</span>).
                    </p>
                    <p className="mt-2 text-xs text-white/50 leading-5">
                      Les signaux du modèle convergent dans la même direction.
                    </p>
                  </>
                )}
              </div>

              {/* Confiance & risque */}
              <div className="rounded-xl border border-white/8 bg-[#111e2b] p-5">
                <p className="text-[9px] uppercase tracking-[0.3em] text-white/30 mb-3">Confiance & risque</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-white/30">Niveau de confiance</p>
                    <p className={`text-lg font-bold ${meta.text}`}>{match.trust_level || "—"}</p>
                    <p className="text-xs text-white/30 tabular-nums">{formatPercent(match.confidence)}</p>
                  </div>
                  <div className="border-t border-white/[0.06] pt-3">
                    <p className="text-xs text-white/40 leading-5">
                      {match.trust_level === "FORTE"
                        ? "Le match paraît relativement lisible. Les signaux convergent."
                        : match.trust_level === "MOYENNE"
                        ? "Le pronostic reste intéressant, mais le scénario peut basculer."
                        : "Le match reste glissant. Le modèle murmure plus qu'il n'affirme."}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* H2H + Classement */}
          <div className="anim-fade-up grid gap-4 xl:grid-cols-2" style={{ animationDelay: "280ms" }}>
            <H2HSection homeTeam={match.home_team} awayTeam={match.away_team} />
            <StandingsSection
              competitionName={match.competition_name}
              homeTeam={match.home_team}
              awayTeam={match.away_team}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center gap-2 py-4 text-center">
            <Logo size={18} />
            <span className="brand-text text-sm font-bold">{BRAND}</span>
            <span className="text-white/20">·</span>
            <span className="text-xs text-white/25">{SLOGAN}</span>
          </div>

        </div>
      </div>
    </div>
  );
}
