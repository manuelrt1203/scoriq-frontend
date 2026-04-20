import { useState } from "react";
import { useAuth } from "./lib/AuthContext";

function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="alg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <path d="M20 1.5L36.5 10.5V28.5L20 37.5L3.5 28.5V10.5Z" fill="url(#alg)" />
      <path d="M23.5 8.5L13 22.5H20.5L17.5 31.5L28 18H20.5Z" fill="white" fillOpacity="0.95" />
    </svg>
  );
}

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode]       = useState("login"); // "login" | "register"
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (mode === "login") {
      const err = await signIn(email, password);
      if (err) setError(err.message);
    } else {
      const err = await signUp(email, password);
      if (err) setError(err.message);
      else setSuccess("Compte créé ! Vérifie ton email pour confirmer ton inscription.");
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d1520] px-4">

      {/* Card */}
      <div className="w-full max-w-sm rounded-2xl border border-white/8 bg-[#111e2b] p-8">

        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo size={44} />
          <div className="text-center">
            <h1 className="brand-text text-2xl font-bold tracking-tight text-white">ScorIQ</h1>
            <p className="mt-1 text-xs text-white/35">L'IA qui voit les matchs autrement</p>
          </div>
        </div>

        {/* Toggle */}
        <div className="mb-6 flex rounded-lg border border-white/8 bg-white/[0.04] p-1">
          {["login", "register"].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); setSuccess(""); }}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
                mode === m
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "text-white/35 hover:text-white/60"
              }`}
            >
              {m === "login" ? "Connexion" : "Inscription"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="toi@exemple.com"
              className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/15 transition"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={6}
              className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/15 transition"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-rose-400/20 bg-rose-500/8 px-3 py-2 text-xs text-rose-300">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-lg border border-emerald-400/20 bg-emerald-500/8 px-3 py-2 text-xs text-emerald-300">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-green w-full rounded-lg py-2.5 text-sm font-semibold text-white"
          >
            {loading ? "…" : mode === "login" ? "Se connecter" : "Créer mon compte"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-xs text-white/20">ScorIQ · Pronostics IA</p>
    </div>
  );
}
