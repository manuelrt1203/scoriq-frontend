import { useEffect, useState } from "react";

const API_BASE = "https://web-production-4b111.up.railway.app";

export default function FavorisManager({ favTeams, favCompetitions, onToggle, onClose }) {
  const [tab, setTab]           = useState("teams"); // "teams" | "competitions"
  const [teams, setTeams]       = useState([]);
  const [comps, setComps]       = useState([]);
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE}/teams`).then((r) => r.json()),
      fetch(`${API_BASE}/competitions`).then((r) => r.json()),
    ]).then(([t, c]) => {
      setTeams(Array.isArray(t) ? t : []);
      setComps(Array.isArray(c) ? c : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const list    = tab === "teams" ? teams : comps;
  const favList = tab === "teams" ? favTeams : favCompetitions;
  const type    = tab === "teams" ? "team" : "competition";

  const filtered = list.filter((item) =>
    item.toLowerCase().includes(search.toLowerCase())
  );

  const favFiltered   = filtered.filter((item) => favList.includes(item));
  const otherFiltered = filtered.filter((item) => !favList.includes(item));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111e2b] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <h2 className="font-semibold text-white">Gérer mes favoris</h2>
          <button onClick={onClose} className="text-white/30 transition hover:text-white/70">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/8 px-5 pt-3">
          {[["teams","Équipes"], ["competitions","Compétitions"]].map(([id, label]) => (
            <button
              key={id}
              onClick={() => { setTab(id); setSearch(""); }}
              className={`rounded-t-lg px-4 py-2 text-sm font-semibold transition ${
                tab === id ? "border-b-2 border-emerald-400 text-emerald-300" : "text-white/40 hover:text-white/70"
              }`}
            >
              {label}
              <span className="ml-2 rounded-full bg-white/8 px-1.5 py-0.5 text-[10px] tabular-nums text-white/40">
                {tab === id ? favList.length : (id === "teams" ? favTeams : favCompetitions).length}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-5 pt-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Rechercher une ${tab === "teams" ? "équipe" : "compétition"}…`}
            className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-emerald-500/40"
            autoFocus
          />
        </div>

        {/* List */}
        <div className="max-h-80 overflow-y-auto px-5 py-3">
          {loading ? (
            <div className="space-y-2 py-2">
              {[1,2,3,4].map(i => <div key={i} className="shimmer h-9 rounded-lg" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/30">Aucun résultat</p>
          ) : (
            <>
              {/* Favoris en premier */}
              {favFiltered.length > 0 && (
                <div className="mb-2">
                  <p className="mb-1.5 text-[9px] uppercase tracking-widest text-white/25">Mes favoris</p>
                  {favFiltered.map((item) => (
                    <ItemRow key={item} name={item} active={true} onToggle={() => onToggle(type, item)} />
                  ))}
                </div>
              )}
              {/* Reste */}
              {otherFiltered.length > 0 && (
                <div>
                  {favFiltered.length > 0 && <p className="mb-1.5 mt-3 text-[9px] uppercase tracking-widest text-white/25">Tous</p>}
                  {otherFiltered.map((item) => (
                    <ItemRow key={item} name={item} active={false} onToggle={() => onToggle(type, item)} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="border-t border-white/8 px-5 py-3 text-right">
          <button onClick={onClose} className="btn-green rounded-lg px-5 py-2 text-sm font-semibold text-white">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

function ItemRow({ name, active, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition hover:bg-white/[0.05] ${active ? "text-white" : "text-white/60"}`}
    >
      <span className="truncate text-left">{name}</span>
      <span className={`ml-3 shrink-0 text-lg transition ${active ? "text-amber-400" : "text-white/15"}`}>
        {active ? "★" : "☆"}
      </span>
    </button>
  );
}
