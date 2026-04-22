import { useState } from "react";
import { useAuth } from "./lib/AuthContext";
import { useLang } from "./lib/LanguageContext";

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

function LangToggle({ lang, toggleLang }) {
  return (
    <button
      onClick={toggleLang}
      className="flex items-center gap-px rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-bold transition hover:bg-white/[0.08]"
    >
      <span className={lang === "fr" ? "text-emerald-300" : "text-white/30"}>FR</span>
      <span className="mx-1 text-white/20">·</span>
      <span className={lang === "en" ? "text-emerald-300" : "text-white/30"}>EN</span>
    </button>
  );
}

export default function AuthPage() {
  const { signIn, signUp, resetPassword, updatePassword, passwordRecovery } = useAuth();
  const { lang, toggleLang, t } = useLang();
  const ta = t.auth;

  const [mode,     setMode]     = useState("login");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");
  const [loading,  setLoading]  = useState(false);

  function reset(m) { setMode(m); setError(""); setSuccess(""); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);

    if (passwordRecovery) {
      const err = await updatePassword(password);
      if (err) setError(err.message);
      else setSuccess(ta.password_updated);
    } else if (mode === "forgot") {
      const err = await resetPassword(email);
      if (err) setError(err.message);
      else setSuccess(ta.link_sent);
    } else if (mode === "login") {
      const err = await signIn(email, password);
      if (err) setError(err.message);
    } else {
      const err = await signUp(email, password);
      if (err) setError(err.message);
      else setSuccess(ta.confirm_email);
    }
    setLoading(false);
  }

  const isForgot = mode === "forgot";
  const isReset  = passwordRecovery;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d1520] px-4">

      {/* Lang toggle top-right */}
      <div className="absolute top-4 right-4">
        <LangToggle lang={lang} toggleLang={toggleLang} />
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-white/8 bg-[#111e2b] p-8 shadow-2xl">

        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo size={44} />
          <div className="text-center">
            <h1 className="brand-text text-2xl font-bold tracking-tight text-white">ScorIQ</h1>
            <p className="mt-1 text-xs text-white/35">{t.slogan}</p>
          </div>
        </div>

        {/* Reset password mode */}
        {isReset ? (
          <>
            <div className="mb-6">
              <p className="text-sm font-semibold text-white/80">{ta.reset_title}</p>
              <p className="mt-1 text-xs text-white/40">{ta.reset_desc}</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">{ta.new_password}</label>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  required placeholder="••••••••" minLength={6}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/15 transition"
                />
              </div>
              {error   && <p className="rounded-lg border border-rose-400/20 bg-rose-500/8 px-3 py-2 text-xs text-rose-300">{error}</p>}
              {success && <p className="rounded-lg border border-emerald-400/20 bg-emerald-500/8 px-3 py-2 text-xs text-emerald-300">{success}</p>}
              <button type="submit" disabled={loading} className="btn-green w-full rounded-lg py-2.5 text-sm font-semibold text-white">
                {loading ? ta.loading : ta.update_password}
              </button>
            </form>
          </>
        ) : isForgot ? (
          /* Forgot password mode */
          <>
            <div className="mb-6">
              <p className="text-sm font-semibold text-white/80">{ta.forgot_title}</p>
              <p className="mt-1 text-xs text-white/40">{ta.forgot_desc}</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">{ta.email}</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  required placeholder="you@example.com"
                  className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/15 transition"
                />
              </div>
              {error   && <p className="rounded-lg border border-rose-400/20 bg-rose-500/8 px-3 py-2 text-xs text-rose-300">{error}</p>}
              {success && <p className="rounded-lg border border-emerald-400/20 bg-emerald-500/8 px-3 py-2 text-xs text-emerald-300">{success}</p>}
              <button type="submit" disabled={loading} className="btn-green w-full rounded-lg py-2.5 text-sm font-semibold text-white">
                {loading ? ta.loading : ta.send_link}
              </button>
              <button type="button" onClick={() => reset("login")} className="w-full text-center text-xs text-white/35 hover:text-white/60 transition pt-1">
                ← {ta.back_to_login}
              </button>
            </form>
          </>
        ) : (
          /* Login / Register mode */
          <>
            <div className="mb-6 flex rounded-lg border border-white/8 bg-white/[0.04] p-1">
              {["login", "register"].map((m) => (
                <button
                  key={m}
                  onClick={() => reset(m)}
                  className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
                    mode === m ? "bg-emerald-500/20 text-emerald-300" : "text-white/35 hover:text-white/60"
                  }`}
                >
                  {m === "login" ? ta.login : ta.register}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">{ta.email}</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  required placeholder="you@example.com"
                  className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/15 transition"
                />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-medium text-white/50">{ta.password}</label>
                  {mode === "login" && (
                    <button type="button" onClick={() => reset("forgot")} className="text-[11px] text-white/30 hover:text-emerald-400 transition">
                      {ta.forgot_password}
                    </button>
                  )}
                </div>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  required placeholder="••••••••" minLength={6}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/15 transition"
                />
              </div>

              {error   && <p className="rounded-lg border border-rose-400/20 bg-rose-500/8 px-3 py-2 text-xs text-rose-300">{error}</p>}
              {success && <p className="rounded-lg border border-emerald-400/20 bg-emerald-500/8 px-3 py-2 text-xs text-emerald-300">{success}</p>}

              <button type="submit" disabled={loading} className="btn-green w-full rounded-lg py-2.5 text-sm font-semibold text-white">
                {loading ? ta.loading : mode === "login" ? ta.sign_in : ta.create_account}
              </button>
            </form>
          </>
        )}
      </div>

      <p className="mt-6 text-xs text-white/20">{ta.footer}</p>
    </div>
  );
}
