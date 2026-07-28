import { useEffect, useRef, useState } from "react";
import { useAgentChat } from "./lib/useAgentChat.js";

const SUGGESTIONS = [
  "Quels sont les meilleurs pronostics du jour ?",
  "Ajoute le PSG à mes favoris",
  "Montre-moi l'onglet historique",
];

function ChatIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3.5 py-2.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-white/40"
          style={{ animation: `agentTypingDot 1.2s ${i * 0.15}s infinite ease-in-out` }}
        />
      ))}
      <style>{`
        @keyframes agentTypingDot {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-2px); }
        }
      `}</style>
    </div>
  );
}

/**
 * Widget de chat flottant : assistant IA capable de répondre sur les
 * pronostics et d'agir pour l'utilisateur (favoris, profil, navigation).
 *
 * `handlers` (requis) : { isFavorite, toggleFavorite, listFavorites,
 * updateProfile, switchTab, openMatch } — voir useAgentChat pour le contrat.
 */
export default function ChatAgent({ handlers }) {
  const [open, setOpen] = useState(false);
  const { thread, busy, error, send } = useAgentChat(handlers);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const fabRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thread, busy, open]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape" && open) {
        setOpen(false);
        fabRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim() || busy) return;
    send(input);
    setInput("");
  }

  return (
    <>
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-label="Assistant ScorIQ"
          className="card card-tight fixed bottom-24 right-4 z-50 flex h-[520px] max-h-[75vh] w-[360px] max-w-[92vw] flex-col p-0 shadow-2xl shadow-black/40 sm:right-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "linear-gradient(135deg, var(--accent-light) 0%, var(--accent-dark) 100%)" }}>
                <ChatIcon />
              </span>
              <div>
                <p className="text-sm font-semibold text-white/90">Assistant ScorIQ</p>
                <p className="text-[11px] text-white/40">Pronostics, favoris, profil</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer l'assistant"
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition hover:bg-white/[0.06] hover:text-white/80"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            role="log"
            aria-live="polite"
            className="flex-1 space-y-3 overflow-y-auto px-3.5 py-4"
          >
            {thread.length === 0 && (
              <div className="space-y-3">
                <p className="px-1 text-xs leading-relaxed text-white/40">
                  Demande-moi les meilleurs pronostics, gère tes favoris ou navigue sur le site.
                </p>
                <div className="flex flex-col gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-left text-xs text-white/70 transition hover:border-white/[0.14] hover:bg-white/[0.06]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {thread.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-br-sm px-3.5 py-2.5 text-sm text-white shadow-sm"
                      : "max-w-[85%] rounded-2xl rounded-bl-sm border border-white/[0.06] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white/85"
                  }
                  style={m.role === "user" ? { background: "linear-gradient(135deg, var(--accent-light) 0%, var(--accent-dark) 100%)" } : undefined}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                </div>
              </div>
            ))}

            {busy && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm border border-white/[0.06] bg-white/[0.04]">
                  <TypingDots />
                </div>
              </div>
            )}

            {error && (
              <p role="alert" className="px-1 text-xs text-red-400/90">
                {error}
              </p>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-white/[0.07] p-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Écris un message…"
              disabled={busy}
              className="h-11 flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-white/[0.2] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Envoyer"
              className="btn-green flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-lg disabled:opacity-40"
            >
              <SendIcon />
            </button>
          </form>
        </div>
      )}

      {/* FAB */}
      <button
        ref={fabRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fermer l'assistant ScorIQ" : "Ouvrir l'assistant ScorIQ"}
        aria-expanded={open}
        className="btn-green fixed bottom-5 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-2xl shadow-emerald-500/30 transition-transform hover:scale-105 active:scale-95 sm:right-6"
      >
        {open ? <CloseIcon /> : <ChatIcon />}
      </button>
    </>
  );
}
