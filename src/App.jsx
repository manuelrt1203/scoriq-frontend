import { useEffect, useMemo, useRef, useState } from "react";
import { Route, Routes, useNavigate, useLocation } from "react-router-dom";
import Matchdetails from "./Matchdetails.jsx";
import AuthPage from "./AuthPage.jsx";
import { useAuth } from "./lib/AuthContext.jsx";
import { useFavorites } from "./lib/useFavorites.js";
import FavorisManager from "./FavorisManager.jsx";
import BetModal from "./BetModal.jsx";
import CarnetTab from "./CarnetTab.jsx";
import { useBets } from "./lib/useBets.js";
import { useLang } from "./lib/LanguageContext.jsx";
import {
  formatGoals,
  formatPercent,
  pickLabel,
  trustMeta,
  TeamLogo,
  ProbBar,
} from "./lib/match-ui.jsx";

const API_BASE = "https://web-production-4b111.up.railway.app";
const BRAND   = "ScorIQ";
const SLOGAN  = "L'IA qui voit les matchs autrement";

/* ── Competition flag lookup ── */
const COMP_FLAGS = {
  "ligue 1": "🇫🇷", "ligue 2": "🇫🇷",
  "premier league": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "championship": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "la liga": "🇪🇸", "segunda": "🇪🇸",
  "bundesliga": "🇩🇪",
  "serie a": "🇮🇹", "serie b": "🇮🇹",
  "eredivisie": "🇳🇱",
  "jupiler": "🇧🇪",
  "champions league": "⭐", "ligue des champions": "⭐",
  "europa league": "🌍", "conference": "🌍",
};
function compFlag(name) {
  const l = (name || "").toLowerCase();
  for (const [k, v] of Object.entries(COMP_FLAGS)) {
    if (l.includes(k)) return v;
  }
  return "🏆";
}

/* ── Tab definitions (dynamic, uses translations) ── */
function getTabs(t) {
  return [
    { id: "matches",    label: t.tabs.matches },
    { id: "favoris",    label: t.tabs.favoris },
    { id: "carnet",     label: t.tabs.carnet },
    { id: "toppicks",   label: t.tabs.toppicks },
    { id: "historique", label: t.tabs.historique },
    { id: "stats",      label: t.tabs.stats },
    { id: "buts",       label: t.tabs.buts },
  ];
}

/* ── Mobile bottom-nav items (dynamic) ── */
function getMobileNav(t) {
  return [
    {
      id: "matches",
      label: t.tabs.matches,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
        </svg>
      ),
    },
    {
      id: "favoris",
      label: t.tabs.favoris,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
    {
      id: "carnet",
      label: t.tabs.carnet,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h16M4 10h16M4 14h10" /><rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
      ),
    },
    {
      id: "toppicks",
      label: t.tabs.toppicks,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l2.5 5 5.5.8-4 3.9.9 5.5L12 14.8l-4.9 2.4.9-5.5-4-3.9 5.5-.8z" />
        </svg>
      ),
    },
    {
      id: "historique",
      label: t.tabs.historique,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      id: "stats",
      label: t.tabs.stats,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
  ];
}

/* ============================================================
   LOGO
   ============================================================ */
function Logo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="lg1" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <path d="M20 1.5L36.5 10.5V28.5L20 37.5L3.5 28.5V10.5Z" fill="url(#lg1)" />
      <path d="M23.5 8.5L13 22.5H20.5L17.5 31.5L28 18H20.5Z" fill="white" fillOpacity="0.95" />
    </svg>
  );
}

/* ============================================================
   STAR BUTTON (favoris)
   ============================================================ */
function StarButton({ active, onClick, size = 14 }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`shrink-0 transition-colors ${active ? "text-amber-400" : "text-white/15 hover:text-white/40"}`}
      title={active ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </button>
  );
}

/* ============================================================
   PING BADGE (live)
   ============================================================ */
function PingBadge({ label = "Live", color = "emerald" }) {
  const colors = {
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 bg-emerald-400",
    red:     "border-red-500/30 bg-red-500/10 text-red-300 bg-red-400",
  };
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 border-emerald-500/30 bg-emerald-500/10`}>
      <span className="ping-dot bg-emerald-400 rounded-full" />
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">{label}</span>
    </div>
  );
}

/* ============================================================
   LANGUAGE TOGGLE
   ============================================================ */
function LangToggle({ lang, toggleLang }) {
  return (
    <button
      onClick={toggleLang}
      className="flex items-center gap-px rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-bold transition hover:bg-white/[0.08]"
      title="Changer de langue / Switch language"
    >
      <span className={lang === "fr" ? "text-emerald-300" : "text-white/30"}>FR</span>
      <span className="mx-1 text-white/20">·</span>
      <span className={lang === "en" ? "text-emerald-300" : "text-white/30"}>EN</span>
    </button>
  );
}

/* ============================================================
   USER MENU
   ============================================================ */
function UserMenu({ user, signOut, t }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initial = (user?.email?.[0] || "?").toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/15 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/25"
      >
        {initial}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#111e2b] shadow-2xl z-50 anim-slide-down">
          <div className="border-b border-white/[0.06] px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-white/30">{t.header.account}</p>
            <p className="mt-0.5 truncate text-xs text-white/60">{user?.email}</p>
          </div>
          <div className="p-1.5">
            <button
              onClick={() => { signOut(); setOpen(false); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-white/50 transition hover:bg-white/[0.05] hover:text-rose-300"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {t.header.signout}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   ODDS BUTTON  (1 / X / 2 style)
   ============================================================ */
function OddsButton({ label, value, isTop }) {
  const pct = Math.round(Number(value || 0) * 100);
  return (
    <div
      className={`flex h-[48px] w-[52px] flex-col items-center justify-center gap-0.5 rounded-lg border select-none transition-all duration-150 sm:h-[52px] sm:w-[60px] ${
        isTop
          ? "odds-active border-emerald-500/45 bg-emerald-500/15"
          : "border-white/10 bg-white/[0.05] hover:border-white/20 hover:bg-white/[0.09]"
      }`}
    >
      <span className={`text-[9px] font-semibold uppercase tracking-wide sm:text-[10px] ${isTop ? "text-emerald-400" : "text-white/35"}`}>
        {label}
      </span>
      <span className={`text-[13px] font-bold tabular-nums sm:text-[15px] ${isTop ? "text-emerald-200" : "text-white/80"}`}>
        {pct}%
      </span>
    </div>
  );
}

/* ============================================================
   MATCH ROW  (compact, betting-site style)
   ============================================================ */
function MatchRow({ match, onOpen, favTeams = [], onToggleTeam, onBet }) {
  const meta         = trustMeta(match.trust_level);
  const insufficient = match.status_prediction === "INSUFFICIENT_HISTORY";
  const hasFavTeam   = favTeams.includes(match.home_team) || favTeams.includes(match.away_team);

  return (
    <div
      onClick={() => onOpen?.(match)}
      className="group flex cursor-pointer items-center gap-2 border-b border-white/[0.05] px-3 py-3 transition-colors hover:bg-white/[0.035] last:border-0 sm:gap-3 sm:px-4"
    >
      {/* Date — hidden on xs */}
      <div className="hidden w-[52px] shrink-0 text-center sm:block">
        <p className="text-[11px] leading-tight text-white/30 tabular-nums">{match.date || "—"}</p>
      </div>

      {/* Teams */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <TeamLogo name={match.home_team} logo={match.home_badge} size="h-5 w-5" />
          <span className="truncate text-sm font-medium text-white/88">{match.home_team}</span>
          <StarButton active={favTeams.includes(match.home_team)} onClick={() => onToggleTeam?.(match.home_team)} />
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <TeamLogo name={match.away_team} logo={match.away_badge} size="h-5 w-5" />
          <span className="truncate text-sm font-medium text-white/88">{match.away_team}</span>
          <StarButton active={favTeams.includes(match.away_team)} onClick={() => onToggleTeam?.(match.away_team)} />
        </div>
        {/* Date shown inline on xs */}
        <p className="mt-1 text-[10px] text-white/25 sm:hidden">{match.date || ""}</p>
      </div>

      {/* 1 X 2 buttons */}
      {insufficient ? (
        <div className="shrink-0 rounded-lg border border-white/8 bg-white/[0.04] px-2 py-1.5 text-[10px] text-white/30">
          Insuff.
        </div>
      ) : (
        <div className="flex shrink-0 gap-1 sm:gap-1.5">
          <OddsButton label="1" value={match.proba_home_win} isTop={match.top_pick === "1"} />
          <OddsButton label="X" value={match.proba_draw}     isTop={match.top_pick === "X"} />
          <OddsButton label="2" value={match.proba_away_win} isTop={match.top_pick === "2"} />
        </div>
      )}

      {/* Score — hidden on mobile */}
      {!insufficient && (
        <div className="hidden w-[60px] shrink-0 text-center lg:block">
          <p className="text-[10px] text-white/25">Score</p>
          {/* Si non cohérent : afficher le score cohérent avec la prédiction */}
          <p className="text-sm font-semibold text-white/75 tabular-nums">
            {match.score_coherent === false
              ? (match.most_likely_score_for_pick || match.most_likely_score || "—")
              : (match.most_likely_score || "—")}
          </p>
          {match.score_coherent === false && (
            <span className="mt-0.5 inline-block text-[9px] font-bold text-amber-400">⚠ ambigu</span>
          )}
        </div>
      )}

      {/* Confidence badge — hidden on mobile */}
      <div className={`hidden shrink-0 rounded-full border px-2.5 py-[3px] text-[10px] font-bold uppercase tracking-wide md:block ${meta.badge}`}>
        {match.trust_level || "—"}
      </div>

      {/* Bet button — fixed width, invisible until hover */}
      <div className="w-16 shrink-0 flex justify-center">
        {!insufficient && (
          <button
            onClick={(e) => { e.stopPropagation(); onBet?.(match); }}
            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 rounded-lg border border-emerald-500/25 bg-emerald-500/8 px-2 py-1 text-[10px] font-semibold text-emerald-400 transition-all hover:bg-emerald-500/20"
            title="Enregistrer un pari"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Parier
          </button>
        )}
      </div>

      {/* Arrow */}
      <svg className="h-4 w-4 shrink-0 text-white/15 transition-colors group-hover:text-white/45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </div>
  );
}

/* ============================================================
   COMPETITION GROUP  (collapsible)
   ============================================================ */
function CompetitionGroup({ name, matches, onOpen, favCompetitions = [], onToggleComp, favTeams = [], onToggleTeam, onBet }) {
  const [open, setOpen] = useState(true);
  const flag = compFlag(name);

  return (
    <div className="anim-fade-up overflow-hidden rounded-xl border border-white/8 bg-[#111e2b]">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 border-b border-white/8 bg-[#0f1926] px-4 py-2.5 text-left transition hover:bg-[#131f2e]"
      >
        <span className="text-base leading-none">{flag}</span>
        <span className="text-sm font-semibold text-white/88">{name}</span>
        <StarButton active={favCompetitions.includes(name)} onClick={() => onToggleComp?.(name)} size={13} />
        <span className="ml-auto mr-2 text-xs text-white/30">
          {matches.length} match{matches.length > 1 ? "s" : ""}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-white/30 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Column headers */}
      {open && (
        <>
          <div className="flex items-center gap-3 border-b border-white/[0.04] px-4 py-1.5">
            <div className="w-[52px] text-[9px] uppercase tracking-widest text-white/20">Date</div>
            <div className="flex-1 text-[9px] uppercase tracking-widest text-white/20">Match</div>
            <div className="flex w-[196px] shrink-0 justify-around text-[9px] uppercase tracking-widest text-white/20 pr-1">
              <span className="w-[60px] text-center">1</span>
              <span className="w-[60px] text-center">X</span>
              <span className="w-[60px] text-center">2</span>
            </div>
            <div className="hidden w-[54px] text-center text-[9px] uppercase tracking-widest text-white/20 lg:block">Score</div>
            <div className="hidden w-16 text-[9px] uppercase tracking-widest text-white/20 md:block">Confiance</div>
            <div className="w-4" />
          </div>

          {matches.map((m, i) => (
            <MatchRow key={`${m.home_team}-${m.away_team}-${i}`} match={m} onOpen={onOpen} favTeams={favTeams} onToggleTeam={onToggleTeam} onBet={onBet} />
          ))}
        </>
      )}
    </div>
  );
}

/* ============================================================
   SKELETON ROW
   ============================================================ */
function SkeletonGroup() {
  return (
    <div className="overflow-hidden rounded-xl border border-white/8 bg-[#111e2b]">
      <div className="flex items-center gap-3 border-b border-white/8 bg-[#0f1926] px-4 py-2.5">
        <div className="shimmer h-3 w-24 rounded" />
        <div className="shimmer ml-auto h-2.5 w-12 rounded" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 border-b border-white/[0.04] px-4 py-3 last:border-0">
          <div className="shimmer w-[52px] h-3 rounded" />
          <div className="flex-1 space-y-2">
            <div className="shimmer h-3 w-32 rounded" />
            <div className="shimmer h-3 w-28 rounded" />
          </div>
          <div className="flex gap-1.5">
            <div className="shimmer h-[52px] w-[60px] rounded-lg" />
            <div className="shimmer h-[52px] w-[60px] rounded-lg" />
            <div className="shimmer h-[52px] w-[60px] rounded-lg" />
          </div>
          <div className="shimmer hidden h-3 w-10 rounded lg:block" />
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   EMPTY STATE
   ============================================================ */
function EmptyState({ onRun, predicting }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-white/12 bg-white/[0.02] px-8 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <Logo size={34} />
      </div>
      <h3 className="mt-5 text-xl font-semibold text-white">Aucun pronostic chargé</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-white/45">
        Lance l'analyse pour obtenir les pronostics du jour, triés par confiance et groupés par compétition.
      </p>
      <button
        onClick={onRun}
        disabled={predicting}
        className="btn-green mt-6 rounded-lg px-6 py-2.5 text-sm font-semibold text-white"
      >
        {predicting ? "Calcul en cours…" : "Lancer les pronostics"}
      </button>
    </div>
  );
}

/* ============================================================
   TAB VIEWS
   ============================================================ */

function MatchesTab({ groupedMatches, visibleMatches, predicting, onOpen, onRun, favTeams, favCompetitions, onToggleTeam, onToggleComp, onBet }) {
  if (predicting && visibleMatches.length === 0) {
    return (
      <div className="space-y-3">
        <SkeletonGroup />
        <SkeletonGroup />
      </div>
    );
  }
  if (visibleMatches.length === 0) {
    return <EmptyState onRun={onRun} predicting={predicting} />;
  }
  return (
    <div className="space-y-3">
      {groupedMatches.map(([comp, list]) => (
        <CompetitionGroup key={comp} name={comp} matches={list} onOpen={onOpen}
          favCompetitions={favCompetitions} onToggleComp={onToggleComp}
          favTeams={favTeams} onToggleTeam={onToggleTeam} onBet={onBet}
        />
      ))}
    </div>
  );
}

function FavorisTab({ matches, favTeams, favCompetitions, onToggleTeam, onToggleComp, onOpen, onToggle }) {
  const [showManager, setShowManager] = useState(false);
  const favMatches = matches.filter((m) =>
    favTeams.includes(m.home_team) || favTeams.includes(m.away_team) || favCompetitions.includes(m.competition_name)
  );

  if (favTeams.length === 0 && favCompetitions.length === 0) {
    return (
      <>
        {showManager && <FavorisManager favTeams={favTeams} favCompetitions={favCompetitions} onToggle={onToggle} onClose={() => setShowManager(false)} />}
        <div className="rounded-xl border border-dashed border-white/12 bg-white/[0.02] px-8 py-16 text-center">
          <p className="text-2xl mb-3">⭐</p>
          <h3 className="text-lg font-semibold text-white">Aucun favori</h3>
          <p className="mt-2 text-sm text-white/40 max-w-xs mx-auto">
            Ajoute des équipes ou compétitions favorites pour voir leurs matchs ici.
          </p>
          <button onClick={() => setShowManager(true)} className="btn-green mt-5 rounded-lg px-5 py-2 text-sm font-semibold text-white">
            Gérer mes favoris
          </button>
        </div>
      </>
    );
  }

  if (favMatches.length === 0) {
    return (
      <>
        {showManager && <FavorisManager favTeams={favTeams} favCompetitions={favCompetitions} onToggle={onToggle} onClose={() => setShowManager(false)} />}
        <div className="rounded-xl border border-dashed border-white/12 bg-white/[0.02] px-8 py-16 text-center">
          <p className="text-sm text-white/40 mb-4">Aucun match du jour pour tes équipes/compétitions favorites.</p>
          <button onClick={() => setShowManager(true)} className="rounded-lg border border-white/10 px-4 py-2 text-xs text-white/50 transition hover:bg-white/[0.05] hover:text-white/80">
            Gérer mes favoris
          </button>
        </div>
      </>
    );
  }

  const grouped = {};
  for (const m of favMatches) {
    const c = m.competition_name || "Autres";
    if (!grouped[c]) grouped[c] = [];
    grouped[c].push(m);
  }

  return (
    <>
      {showManager && <FavorisManager favTeams={favTeams} favCompetitions={favCompetitions} onToggle={onToggle} onClose={() => setShowManager(false)} />}
      <div className="mb-3 flex justify-end">
        <button onClick={() => setShowManager(true)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/45 transition hover:bg-white/[0.05] hover:text-white/80">
          ⭐ Gérer mes favoris
        </button>
      </div>
      <div className="space-y-3">
        {Object.entries(grouped).map(([comp, list]) => (
          <CompetitionGroup key={comp} name={comp} matches={list} onOpen={onOpen}
            favCompetitions={favCompetitions} onToggleComp={onToggleComp}
            favTeams={favTeams} onToggleTeam={onToggleTeam}
          />
        ))}
      </div>
    </>
  );
}

function TopPicksTab({ topPicks, onOpen }) {
  if (topPicks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/12 bg-white/[0.02] px-8 py-12 text-center">
        <p className="text-white/40">Aucun top pick disponible. Lance les pronostics d'abord.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {topPicks.map((match, i) => {
        const meta = trustMeta(match.trust_level);
        return (
          <div
            key={`${match.id || i}`}
            onClick={() => onOpen?.(match)}
            className="anim-fade-up flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-white/8 bg-[#111e2b] p-4 transition hover:border-emerald-500/20 hover:bg-[#162130]"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="gold-text text-xs font-bold">#{i + 1}</span>
                <span className="text-[11px] text-white/35">{match.competition_name}</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <TeamLogo name={match.home_team} logo={match.home_badge} size="h-6 w-6" />
                <span className="text-sm font-semibold text-white/90 truncate">{match.home_team}</span>
              </div>
              <div className="flex items-center gap-2">
                <TeamLogo name={match.away_team} logo={match.away_badge} size="h-6 w-6" />
                <span className="text-sm font-semibold text-white/90 truncate">{match.away_team}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.badge}`}>
                  {match.trust_level}
                </span>
                <span className="text-sm text-white/60">{pickLabel(match.top_pick)}</span>
                <span className="text-sm text-white/35">· {formatPercent(match.confidence)}</span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] text-white/30">Score projeté</p>
              <p className="mt-1 text-2xl font-bold text-white">{match.most_likely_score || "—"}</p>
              <p className="text-xs text-white/35">{formatPercent(match.most_likely_score_prob)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ConfidenceCalibration() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/predictions/history?limit=500&only_evaluated=true`)
      .then((r) => r.json())
      .then((data) => { setHistory(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const levels = useMemo(() => {
    const lvls = ["FORTE", "MOYENNE", "FAIBLE"];
    return lvls.map((lvl) => {
      const items  = history.filter((r) => r.trust_level === lvl);
      const ok     = items.filter((r) => r.is_correct_1x2 === 1).length;
      const total  = items.length;
      const rate   = total ? Math.round(ok / total * 100) : null;
      return { lvl, ok, total, rate };
    });
  }, [history]);

  const barColor = (lvl) =>
    lvl === "FORTE" ? "bg-emerald-400" : lvl === "MOYENNE" ? "bg-amber-400" : "bg-rose-400";
  const dotColor = (lvl) =>
    lvl === "FORTE" ? "text-emerald-300" : lvl === "MOYENNE" ? "text-amber-300" : "text-rose-300";

  return (
    <div className="rounded-xl border border-white/8 bg-[#111e2b] p-5">
      <p className="mb-4 text-[10px] uppercase tracking-widest text-white/30">Confiance calibrée — réussite réelle par niveau</p>
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="shimmer h-10 rounded-lg" />)}</div>
      ) : history.length === 0 ? (
        <p className="text-sm text-white/30">Pas encore assez de données évaluées.</p>
      ) : (
        <div className="space-y-4">
          {levels.map(({ lvl, ok, total, rate }) => (
            <div key={lvl}>
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${barColor(lvl)}`} />
                  <span className="text-sm font-medium text-white/70">{lvl}</span>
                  <span className="text-xs text-white/30">{total} matchs</span>
                </div>
                <span className={`text-sm font-bold tabular-nums ${dotColor(lvl)}`}>
                  {rate != null ? `${rate}%` : "—"}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${barColor(lvl)}`}
                  style={{ width: rate != null ? `${rate}%` : "0%" }}
                />
              </div>
              {rate != null && (
                <p className="mt-0.5 text-[10px] text-white/25">{ok} correctes sur {total}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatsTab({ summary, loading }) {
  const rows = [
    { label: "Prédictions enregistrées", value: summary?.total_predictions ?? "—",           note: "Volume total en base" },
    { label: "Prédictions évaluées",      value: summary?.evaluated_predictions ?? "—",       note: "Confrontées au résultat réel" },
    { label: "Accuracy 1X2",              value: formatPercent(summary?.accuracy_1x2),         note: "Issue principale correcte", hl: true },
    { label: "Accuracy BTTS",             value: formatPercent(summary?.accuracy_btts),        note: "Les deux équipes marquent", hl: true },
    { label: "Accuracy Over 2.5",         value: formatPercent(summary?.accuracy_over_2_5),    note: "Plus de 2 buts et demi", hl: true },
    { label: "Accuracy Over 1.5",         value: formatPercent(summary?.accuracy_over_1_5),    note: "Plus de 1 but et demi" },
    {
      label: "MAE buts totaux",
      value: summary?.mae_total_goals != null ? Number(summary.mae_total_goals).toFixed(2) : "—",
      note: "Erreur moyenne sur le total de buts",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map(({ label, value, note, hl }, i) => (
          <div
            key={label}
            className={`anim-fade-up rounded-xl border p-5 ${
              hl ? "border-emerald-500/20 bg-emerald-500/8" : "border-white/8 bg-[#111e2b]"
            }`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <p className="text-[10px] uppercase tracking-widest text-white/35">{label}</p>
            <p className={`mt-2 text-3xl font-bold tabular-nums ${hl ? "text-emerald-300" : "text-white"}`}>
              {loading ? "…" : value}
            </p>
            <p className="mt-1.5 text-xs text-white/35">{note}</p>
          </div>
        ))}
      </div>
      <ConfidenceCalibration />
    </div>
  );
}

function ButsTab({ summary, loading }) {
  const markets = [
    { label: "Over 1.5",  value: formatPercent(summary?.accuracy_over_1_5), note: "Précision sur + de 1 but et demi", color: "sky" },
    { label: "Over 2.5",  value: formatPercent(summary?.accuracy_over_2_5), note: "Précision sur + de 2 buts et demi", color: "violet" },
    { label: "BTTS — Oui", value: formatPercent(summary?.accuracy_btts),    note: "Les deux équipes marquent",          color: "rose" },
  ];
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {markets.map(({ label, value, note, color }, i) => (
          <div
            key={label}
            className="anim-fade-up rounded-xl border border-white/8 bg-[#111e2b] p-5"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <p className="text-[10px] uppercase tracking-widest text-white/35">{label}</p>
            <p className="mt-2 text-3xl font-bold text-white tabular-nums">{loading ? "…" : value}</p>
            <p className="mt-1.5 text-xs text-white/35">{note}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/8 bg-[#111e2b] p-5">
        <p className="text-sm font-semibold text-white/70 mb-4">Récapitulatif visuel</p>
        <div className="space-y-4">
          <ProbBar label="Over 1.5" value={summary?.accuracy_over_1_5} colorClass="bg-gradient-to-r from-sky-400 to-cyan-500" />
          <ProbBar label="Over 2.5" value={summary?.accuracy_over_2_5} colorClass="bg-gradient-to-r from-violet-400 to-fuchsia-500" />
          <ProbBar label="BTTS"     value={summary?.accuracy_btts}     colorClass="bg-gradient-to-r from-rose-400 to-pink-500" />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   HISTORIQUE TAB
   ============================================================ */

function HistoriqueTab() {
  const [history,    setHistory]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [filterH,    setFilterH]    = useState("ALL");   // ALL | CORRECT | WRONG
  const [filterTrust, setFilterTrust] = useState("ALL"); // ALL | FORTE | MOYENNE | FAIBLE
  const [searchH,    setSearchH]    = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/predictions/history?limit=200&only_evaluated=true`)
      .then((r) => r.json())
      .then((data) => { setHistory(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setError("Impossible de charger l'historique."); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    let items = [...history];
    if (filterH === "CORRECT") items = items.filter((r) => r.is_correct_1x2 === 1);
    if (filterH === "WRONG")   items = items.filter((r) => r.is_correct_1x2 === 0);
    if (filterTrust !== "ALL") items = items.filter((r) => r.trust_level === filterTrust);
    if (searchH.trim()) {
      const q = searchH.trim().toLowerCase();
      items = items.filter((r) =>
        [r.home_team, r.away_team, r.competition_name].filter(Boolean).some((v) => v.toLowerCase().includes(q))
      );
    }
    return items;
  }, [history, filterH, filterTrust, searchH]);

  /* Stats rapides */
  const stats = useMemo(() => {
    const ok = history.filter((r) => r.is_correct_1x2 === 1).length;
    const total = history.filter((r) => r.is_correct_1x2 !== null).length;
    const forteOk = history.filter((r) => r.trust_level === "FORTE" && r.is_correct_1x2 === 1).length;
    const forteTotal = history.filter((r) => r.trust_level === "FORTE").length;
    return { ok, total, forteOk, forteTotal };
  }, [history]);

  /* Group by date */
  const grouped = useMemo(() => {
    const g = {};
    for (const r of filtered) {
      const d = r.match_date || "—";
      if (!g[d]) g[d] = [];
      g[d].push(r);
    }
    return Object.entries(g).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3].map(i => <div key={i} className="shimmer h-20 rounded-xl" />)}
    </div>
  );

  if (error) return (
    <div className="rounded-xl border border-rose-400/20 bg-rose-500/8 px-4 py-3 text-sm text-rose-200">{error}</div>
  );

  return (
    <div className="space-y-4">
      {/* Mini stats banner */}
      {history.length > 0 && (
        <div className="anim-fade-up grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Évalués",    value: stats.total,                   sub: "matchs notés" },
            { label: "Corrects 1X2", value: stats.ok,                   sub: `sur ${stats.total}` },
            { label: "Accuracy",   value: stats.total ? `${Math.round(stats.ok/stats.total*100)}%` : "—", sub: "résultat principal", hl: true },
            { label: "Forte conf.", value: stats.forteTotal ? `${Math.round(stats.forteOk/stats.forteTotal*100)}%` : "—", sub: `${stats.forteTotal} matchs FORTE`, hl: true },
          ].map(({ label, value, sub, hl }) => (
            <div key={label} className={`rounded-xl border p-4 ${hl ? "border-emerald-500/20 bg-emerald-500/8" : "border-white/8 bg-[#111e2b]"}`}>
              <p className="text-[9px] uppercase tracking-widest text-white/30">{label}</p>
              <p className={`mt-1.5 text-2xl font-bold tabular-nums ${hl ? "text-emerald-300" : "text-white"}`}>{value}</p>
              <p className="text-[10px] text-white/30">{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={searchH}
          onChange={(e) => setSearchH(e.target.value)}
          placeholder="Rechercher une équipe…"
          className="h-8 min-w-[180px] flex-1 max-w-xs rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm text-white placeholder:text-white/22 outline-none focus:border-emerald-500/40"
        />
        <div className="flex gap-1.5">
          {[["ALL","Tous"],["CORRECT","✓ Corrects"],["WRONG","✗ Ratés"]].map(([v,l]) => (
            <button key={v} onClick={() => setFilterH(v)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${filterH===v ? "border-emerald-500/35 bg-emerald-500/12 text-emerald-300" : "border-white/8 bg-white/[0.04] text-white/40 hover:text-white/70"}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {[["ALL","Toute conf."],["FORTE","Forte"],["MOYENNE","Moy."],["FAIBLE","Faible"]].map(([v,l]) => (
            <button key={v} onClick={() => setFilterTrust(v)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${filterTrust===v ? "border-emerald-500/35 bg-emerald-500/12 text-emerald-300" : "border-white/8 bg-white/[0.04] text-white/40 hover:text-white/70"}`}>
              {l}
            </button>
          ))}
        </div>
        {filtered.length !== history.length && (
          <span className="text-xs text-white/30">{filtered.length} / {history.length}</span>
        )}
      </div>

      {/* Match rows grouped by date */}
      {grouped.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/12 bg-white/[0.02] px-8 py-12 text-center">
          <p className="text-white/40">Aucun résultat pour ce filtre.</p>
        </div>
      ) : (
        grouped.map(([date, rows]) => (
          <div key={date} className="anim-fade-up overflow-hidden rounded-xl border border-white/8 bg-[#111e2b]">
            {/* Date header */}
            <div className="flex items-center gap-3 border-b border-white/8 bg-[#0f1926] px-4 py-2.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/30">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span className="text-sm font-semibold text-white/80">{date}</span>
              <span className="ml-auto text-xs text-white/30">{rows.length} match{rows.length > 1 ? "s" : ""}</span>
              {/* Mini accuracy for this day */}
              {(() => {
                const dayOk = rows.filter(r => r.is_correct_1x2 === 1).length;
                const dayTotal = rows.filter(r => r.is_correct_1x2 !== null).length;
                if (!dayTotal) return null;
                const pct = Math.round(dayOk / dayTotal * 100);
                return (
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${pct >= 60 ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : pct >= 40 ? "border-amber-500/30 bg-amber-500/10 text-amber-300" : "border-rose-500/30 bg-rose-500/10 text-rose-300"}`}>
                    {dayOk}/{dayTotal} correct{dayOk > 1 ? "s" : ""}
                  </span>
                );
              })()}
            </div>

            {/* Match rows */}
            {rows.map((r) => {
              const ok1x2   = r.is_correct_1x2   === 1;
              const okScore = r.is_correct_score  === 1;
              const meta    = trustMeta(r.trust_level);
              const realScore = `${r.real_home_goals ?? "?"}−${r.real_away_goals ?? "?"}`;
              const predScore = r.most_likely_score
                ? r.most_likely_score.replace("-", "−")
                : "—";
              // Real 1X2 label
              const realResult =
                r.real_home_goals > r.real_away_goals ? "Victoire dom." :
                r.real_home_goals < r.real_away_goals ? "Victoire ext." :
                r.real_home_goals === r.real_away_goals ? "Match nul" : "—";

              // Composite left indicator
              const bothOk    = ok1x2 && okScore;
              const scoreOnly = !ok1x2 && okScore;
              const resultOnly = ok1x2 && !okScore;
              const noneOk    = !ok1x2 && !okScore;

              const indicatorCls = bothOk    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                 : resultOnly ? "bg-emerald-500/12 text-emerald-400 border-emerald-500/20"
                                 : scoreOnly  ? "bg-amber-500/15 text-amber-300 border-amber-500/25"
                                 :              "bg-rose-500/12 text-rose-300 border-rose-500/20";
              const indicatorLabel = bothOk ? "✓✓" : resultOnly ? "1X2 ✓" : scoreOnly ? "~ ✓" : "✗";

              return (
                <div key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-white/[0.05] px-4 py-3.5 last:border-0 hover:bg-white/[0.025] transition-colors">

                  {/* Composite indicator */}
                  <div className={`flex h-10 w-12 shrink-0 items-center justify-center rounded-lg border text-[11px] font-bold ${indicatorCls}`}>
                    {indicatorLabel}
                  </div>

                  {/* Teams */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <TeamLogo name={r.home_team} logo={r.home_badge} size="h-5 w-5" />
                      <span className="text-sm font-medium text-white/88 truncate">{r.home_team}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <TeamLogo name={r.away_team} logo={r.away_badge} size="h-5 w-5" />
                      <span className="text-sm font-medium text-white/88 truncate">{r.away_team}</span>
                    </div>
                  </div>

                  {/* ── Résultat 1X2 ── */}
                  <div className="hidden shrink-0 sm:block">
                    <p className="text-[9px] uppercase tracking-widest text-white/25 mb-1.5">Résultat 1X2</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-white/50">{pickLabel(r.top_pick)}</span>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/20">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                      <span className={`text-xs font-semibold ${ok1x2 ? "text-emerald-300" : "text-rose-300"}`}>
                        {realResult}
                      </span>
                      <span className={`text-[11px] font-bold ${ok1x2 ? "text-emerald-400" : "text-rose-400"}`}>
                        {ok1x2 ? "✓" : "✗"}
                      </span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="hidden h-8 w-px bg-white/[0.08] shrink-0 sm:block" />

                  {/* ── Score exact ── */}
                  <div className="hidden shrink-0 sm:block">
                    <p className="text-[9px] uppercase tracking-widest text-white/25 mb-1.5">Score exact</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-white/50 tabular-nums">{predScore}</span>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/20">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                      <span className={`text-sm font-bold tabular-nums ${okScore ? "text-emerald-300" : "text-white/60"}`}>
                        {realScore}
                      </span>
                      <span className={`text-[11px] font-bold ${okScore ? "text-emerald-400" : "text-white/30"}`}>
                        {okScore ? "✓" : "✗"}
                      </span>
                    </div>
                  </div>

                  {/* Mobile: compact summary — w-full force new line */}
                  <div className="flex w-full items-center gap-2 pl-14 sm:hidden text-xs text-white/50">
                    <span className="truncate"><span className="text-white/40">{pickLabel(r.top_pick)}</span> → <span className={ok1x2 ? "text-emerald-300 font-semibold" : "text-rose-300 font-semibold"}>{realResult}</span></span>
                    <span className="text-white/20 shrink-0">·</span>
                    <span className="tabular-nums shrink-0">{predScore} → <span className={okScore ? "text-emerald-300 font-semibold" : "text-white/50"}>{realScore}</span></span>
                  </div>

                  {/* Confidence */}
                  <div className="hidden shrink-0 text-right md:block">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.badge}`}>
                      {r.trust_level}
                    </span>
                    <p className="mt-1 text-[10px] text-white/30 tabular-nums">{formatPercent(r.confidence)}</p>
                  </div>

                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}

/* ============================================================
   FILTER BUTTON
   ============================================================ */
function FilterBtn({ label, value, current, onClick }) {
  const active = current === value;
  return (
    <button
      onClick={() => onClick(value)}
      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
        active
          ? "border-emerald-500/35 bg-emerald-500/12 text-emerald-300"
          : "border-white/8 bg-white/[0.04] text-white/40 hover:border-white/15 hover:bg-white/[0.07] hover:text-white/70"
      }`}
    >
      {label}
    </button>
  );
}

/* ============================================================
   DASHBOARD PAGE
   ============================================================ */
function DashboardPage() {
  const { lang, toggleLang, t }                         = useLang();
  const { user, signOut }                               = useAuth();
  const { favTeams, favCompetitions, isFav, toggle }    = useFavorites();
  const { bets, loading: betsLoading, addBet, updateResult, deleteBet, autoEvaluate } = useBets();
  const [betMatch, setBetMatch] = useState(null);
  const [summary,    setSummary]    = useState(null);
  const [matches,    setMatches]    = useState([]);
  const [topPicks,   setTopPicks]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [error,      setError]      = useState("");
  const [search,     setSearch]     = useState("");
  const [filter,     setFilter]     = useState("ALL");
  const [compFilter, setCompFilter] = useState(null);
  const [activeTab,  setActiveTab]  = useState("matches");
  const [favAlerts,  setFavAlerts]  = useState([]);
  const [lastRunAt,  setLastRunAt]  = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.openBet) {
      setBetMatch(location.state.openBet);
      window.history.replaceState({}, "");
    }
  }, [location.state]);

  function openMatch(match) {
    const encoded = encodeURIComponent(`${match.home_team}__${match.away_team}__${match.date || ""}`);
    navigate(`/match/${encoded}`, { state: { match } });
  }

  /* Filter + search + sort */
  const visibleMatches = useMemo(() => {
    let items = [...matches];
    if (compFilter) items = items.filter((m) => m.competition_name === compFilter);
    if (filter !== "ALL") items = items.filter((m) => (m.trust_level || "UNKNOWN") === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter((m) =>
        [m.home_team, m.away_team, m.competition_name].filter(Boolean).some((v) => v.toLowerCase().includes(q))
      );
    }
    items.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    return items;
  }, [matches, search, filter, compFilter]);

  /* Group by competition */
  const groupedMatches = useMemo(() => {
    const groups = {};
    for (const m of visibleMatches) {
      const c = m.competition_name || "Autres";
      if (!groups[c]) groups[c] = [];
      groups[c].push(m);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [visibleMatches]);

  /* Unique competition list for sidebar */
  const competitions = useMemo(() => {
    return [...new Set(matches.map((m) => m.competition_name).filter(Boolean))].sort();
  }, [matches]);

  async function fetchJson(url, options) {
    const res = await fetch(url, options);
    if (!res.ok) {
      const p = await res.json().catch(() => ({}));
      throw new Error(p.detail || `Erreur API (${res.status})`);
    }
    return res.json();
  }

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const [s, t] = await Promise.all([
        fetchJson(`${API_BASE}/stats/summary`),
        fetchJson(`${API_BASE}/top-picks`),
      ]);
      setSummary(s);
      setTopPicks(Array.isArray(t) ? t : []);
    } catch (err) {
      setError(err.message || "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }

  async function runPredictions() {
    setPredicting(true);
    setError("");
    try {
      let data;
      try { data = await fetchJson(`${API_BASE}/predict/today`, { method: "POST" }); }
      catch { data = await fetchJson(`${API_BASE}/predict/today`); }
      const allM = Array.isArray(data.matches) ? data.matches : [];
      setMatches(allM);
      const alerts = allM.filter(
        (m) => m.trust_level === "FORTE" &&
          (favTeams.includes(m.home_team) || favTeams.includes(m.away_team) ||
           favCompetitions.includes(m.competition_name))
      );
      setFavAlerts(alerts);
      setLastRunAt(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
      await loadDashboard();
    } catch (err) {
      setError(err.message || "Erreur pendant les pronostics.");
    } finally {
      setPredicting(false);
    }
  }

  useEffect(() => { loadDashboard(); }, []);

  /* ── RENDER ── */
  return (
    <div className="flex flex-col bg-[#0d1520] text-white" style={{ height: "100dvh", overflow: "hidden" }}>
      {betMatch && <BetModal match={betMatch} allMatches={matches} onAdd={addBet} onClose={() => setBetMatch(null)} />}

      {/* ════════════════════ TOP NAV ════════════════════ */}
      <header className="anim-slide-down flex h-[56px] shrink-0 items-center gap-3 border-b border-white/8 bg-[#091624] px-4">

        {/* Brand */}
        <div className="flex items-center gap-2.5 mr-2 shrink-0">
          <Logo size={28} />
          <span className="brand-text text-lg font-bold tracking-tight">{BRAND}</span>
        </div>

        {/* Tabs — desktop only */}
        <nav className="hidden items-center gap-0.5 overflow-x-auto lg:flex">
          {getTabs(t).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 rounded-lg px-3.5 py-2 text-[13px] font-medium transition whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-emerald-500/12 text-emerald-300"
                  : "text-white/40 hover:bg-white/[0.05] hover:text-white/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {matches.length > 0 && !predicting && (
            <span className="hidden sm:block"><PingBadge label={t.header.loaded} /></span>
          )}
          {lastRunAt && (
            <span className="hidden text-[11px] text-white/30 xl:block">
              {t.header.updated_at} {lastRunAt}
            </span>
          )}
          <button
            onClick={loadDashboard}
            className="hidden rounded-lg border border-white/10 px-3 py-1.5 text-[12px] text-white/45 transition hover:bg-white/[0.06] hover:text-white/70 md:block"
          >
            {t.header.refresh}
          </button>
          <LangToggle lang={lang} toggleLang={toggleLang} />
          <button
            onClick={runPredictions}
            disabled={predicting}
            className="btn-green rounded-lg px-3 py-1.5 text-sm font-semibold text-white sm:px-4 sm:py-2"
          >
            <span className="sm:hidden">{predicting ? "…" : t.header.run}</span>
            <span className="hidden sm:inline">{predicting ? t.header.running : t.header.run_full}</span>
          </button>
          <UserMenu user={user} signOut={signOut} t={t} />
        </div>
      </header>

      {/* ════════ ALERTES FAVORIS ════════ */}
      {favAlerts.length > 0 && (
        <div className="anim-slide-down shrink-0 flex items-center gap-3 border-b border-amber-500/20 bg-amber-500/8 px-4 py-2.5">
          <span className="text-base leading-none">⭐</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-300">
              {favAlerts.length === 1
                ? `${favAlerts[0].home_team} vs ${favAlerts[0].away_team} — confiance FORTE`
                : `${favAlerts.length} matchs FORTE impliquent tes favoris`}
            </p>
            {favAlerts.length > 1 && (
              <p className="truncate text-xs text-amber-400/60">
                {favAlerts.map((m) => `${m.home_team} vs ${m.away_team}`).join(" · ")}
              </p>
            )}
          </div>
          <button
            onClick={() => { setActiveTab("matches"); setFilter("FORTE"); setFavAlerts([]); }}
            className="shrink-0 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20"
          >
            Voir
          </button>
          <button onClick={() => setFavAlerts([])} className="shrink-0 text-amber-400/40 transition hover:text-amber-300">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      {/* ════════════════════ BODY ════════════════════ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT SIDEBAR ── */}
        <aside className="anim-slide-left hidden w-[200px] shrink-0 overflow-y-auto border-r border-white/8 lg:block">

          {/* Sports */}
          <div className="p-3">
            <p className="mb-2 px-2 text-[9px] uppercase tracking-[0.35em] text-white/25">{t.sidebar.sports}</p>
            <div className="flex items-center gap-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5">
              <span className="text-base leading-none">⚽</span>
              <span className="text-sm font-semibold text-white/88">Football</span>
              {matches.length > 0 && (
                <span className="ml-auto rounded-full bg-emerald-500/25 px-2 py-0.5 text-xs font-bold text-emerald-300">
                  {matches.length}
                </span>
              )}
            </div>
          </div>

          {/* Confidence filter */}
          <div className="mt-1 border-t border-white/[0.06] p-3">
            <p className="mb-2 px-2 text-[9px] uppercase tracking-[0.35em] text-white/25">{t.sidebar.confidence}</p>
            {[
              { val: "ALL",     label: t.sidebar.all_matches },
              { val: "FORTE",   label: t.sidebar.high },
              { val: "MOYENNE", label: t.sidebar.medium },
              { val: "FAIBLE",  label: t.sidebar.low },
            ].map(({ val, label }) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-left transition ${
                  filter === val
                    ? "bg-emerald-500/10 text-white"
                    : "text-white/40 hover:bg-white/[0.04] hover:text-white/65"
                }`}
              >
                {val !== "ALL" && (
                  <span className={`h-2 w-2 rounded-full shrink-0 ${
                    val === "FORTE" ? "bg-emerald-400" : val === "MOYENNE" ? "bg-amber-400" : "bg-rose-400"
                  }`} />
                )}
                {label}
              </button>
            ))}
          </div>

          {/* Competition filter */}
          {competitions.length > 0 && (
            <div className="mt-1 border-t border-white/[0.06] p-3">
              <p className="mb-2 px-2 text-[9px] uppercase tracking-[0.35em] text-white/25">{t.sidebar.competitions}</p>
              <button
                onClick={() => setCompFilter(null)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-left transition ${
                  compFilter === null ? "bg-white/[0.06] text-white" : "text-white/40 hover:bg-white/[0.04] hover:text-white/65"
                }`}
              >
                {t.sidebar.all}
              </button>
              {competitions.map((c) => (
                <button
                  key={c}
                  onClick={() => setCompFilter(compFilter === c ? null : c)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-left transition ${
                    compFilter === c ? "bg-white/[0.06] text-white" : "text-white/40 hover:bg-white/[0.04] hover:text-white/65"
                  }`}
                >
                  <span className="text-sm leading-none">{compFlag(c)}</span>
                  <span className="truncate">{c}</span>
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 overflow-y-auto">

          {/* Sticky sub-header */}
          <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-white/8 bg-[#0d1520]/95 px-4 py-2.5 backdrop-blur-sm">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.search.placeholder}
              className="h-8 min-w-[200px] flex-1 max-w-xs rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm text-white placeholder:text-white/22 outline-none transition focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/15"
            />
            <div className="flex gap-1.5">
              <FilterBtn label={t.sidebar.all_matches} value="ALL"     current={filter} onClick={setFilter} />
              <FilterBtn label={t.sidebar.high}        value="FORTE"   current={filter} onClick={setFilter} />
              <FilterBtn label={t.sidebar.medium}      value="MOYENNE" current={filter} onClick={setFilter} />
              <FilterBtn label={t.sidebar.low}         value="FAIBLE"  current={filter} onClick={setFilter} />
            </div>
            {visibleMatches.length > 0 && (
              <span className="hidden text-xs text-white/25 xl:block">
                {t.matches.matches_count(visibleMatches.length)}
              </span>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="m-4 rounded-lg border border-rose-400/20 bg-rose-500/8 px-4 py-3 text-sm text-rose-200">
              <span className="font-semibold">Erreur : </span>{error}
            </div>
          )}

          {/* Tab content — extra bottom padding on mobile for the bottom nav */}
          <div className="p-3 pb-20 sm:p-4 lg:pb-4">
            {activeTab === "matches" && (
              <MatchesTab
                groupedMatches={groupedMatches}
                visibleMatches={visibleMatches}
                predicting={predicting}
                onOpen={openMatch}
                onRun={runPredictions}
                favTeams={favTeams}
                favCompetitions={favCompetitions}
                onToggleTeam={(name) => toggle("team", name)}
                onToggleComp={(name) => toggle("competition", name)}
                onBet={setBetMatch}
              />
            )}
            {activeTab === "favoris" && (
              <FavorisTab
                matches={matches}
                favTeams={favTeams}
                favCompetitions={favCompetitions}
                onToggleTeam={(name) => toggle("team", name)}
                onToggleComp={(name) => toggle("competition", name)}
                onToggle={toggle}
                onOpen={openMatch}
              />
            )}
            {activeTab === "carnet" && (
              <CarnetTab
                bets={bets}
                loading={betsLoading}
                onUpdateResult={updateResult}
                onDelete={deleteBet}
                onAutoEvaluate={autoEvaluate}
              />
            )}
            {activeTab === "toppicks" && (
              <TopPicksTab topPicks={topPicks} onOpen={openMatch} />
            )}
            {activeTab === "historique" && (
              <HistoriqueTab />
            )}
            {activeTab === "stats" && (
              <StatsTab summary={summary} loading={loading} />
            )}
            {activeTab === "buts" && (
              <ButsTab summary={summary} loading={loading} />
            )}
          </div>
        </main>

        {/* ── MOBILE BOTTOM NAV ── */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex h-14 items-stretch border-t border-white/10 bg-[#091624]">
          {getMobileNav(t).map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors ${
                activeTab === id ? "text-emerald-400" : "text-white/30 hover:text-white/55"
              }`}
            >
              {icon}
              <span className="text-[9px] font-semibold uppercase tracking-wide">{label}</span>
            </button>
          ))}
        </nav>

        {/* ── RIGHT PANEL ── */}
        <aside className="hidden w-[256px] shrink-0 overflow-y-auto border-l border-white/8 p-4 xl:block space-y-4">

          {/* Mini stats */}
          <div className="rounded-xl border border-white/8 bg-[#111e2b] p-4">
            <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-white/30">{t.sidebar.performances}</p>
            {[
              ["Accuracy 1X2",    summary ? formatPercent(summary.accuracy_1x2)      : "—"],
              ["BTTS",            summary ? formatPercent(summary.accuracy_btts)     : "—"],
              ["Over 2.5",        summary ? formatPercent(summary.accuracy_over_2_5) : "—"],
              ["Prédictions",     summary ? String(summary.total_predictions)        : "—"],
            ].map(([label, val]) => (
              <div
                key={label}
                className="flex items-center justify-between border-b border-white/[0.05] py-2.5 last:border-0"
              >
                <span className="text-sm text-white/50">{label}</span>
                <span className="text-sm font-semibold text-white tabular-nums">{loading ? "…" : val}</span>
              </div>
            ))}
          </div>

          {/* Top picks mini */}
          <div className="rounded-xl border border-white/8 bg-[#111e2b] p-4">
            <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-white/30">{t.sidebar.top_picks}</p>
            {topPicks.length === 0 ? (
              <p className="text-xs text-white/30">{t.sidebar.no_picks}</p>
            ) : (
              topPicks.slice(0, 5).map((m, i) => {
                const meta = trustMeta(m.trust_level);
                return (
                  <div
                    key={i}
                    onClick={() => openMatch(m)}
                    className="cursor-pointer border-b border-white/[0.05] py-3 transition hover:opacity-80 last:border-0"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="gold-text text-[10px] font-bold">#{i + 1}</span>
                      <span className={`rounded-full border px-1.5 py-px text-[9px] font-bold uppercase ${meta.badge}`}>
                        {m.trust_level}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-white/80 truncate">
                      {m.home_team} vs {m.away_team}
                    </p>
                    <p className="mt-0.5 text-[11px] text-white/40">
                      {pickLabel(m.top_pick)} · {formatPercent(m.confidence)}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Action */}
          <button
            onClick={runPredictions}
            disabled={predicting}
            className="btn-green w-full rounded-xl py-3 text-sm font-semibold text-white"
          >
            {predicting ? t.header.running : t.header.run_full}
          </button>

          {/* Brand footer */}
          <div className="text-center pt-2">
            <div className="flex items-center justify-center gap-2">
              <Logo size={18} />
              <span className="brand-text text-sm font-bold">{BRAND}</span>
            </div>
            <p className="mt-1 text-[10px] text-white/20">{t.slogan}</p>
          </div>
        </aside>

      </div>
    </div>
  );
}

/* ============================================================
   APP ROUTER
   ============================================================ */
export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0d1520]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-emerald-400" />
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return (
    <Routes>
      <Route path="/"          element={<DashboardPage />} />
      <Route path="/match/:id" element={<Matchdetails />} />
    </Routes>
  );
}
