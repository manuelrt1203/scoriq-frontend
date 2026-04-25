import { useEffect, useRef, useState } from "react";
import { useAuth } from "./lib/AuthContext";
import { useProfile } from "./lib/useProfile";
import { useTheme, ACCENT_OPTIONS } from "./lib/ThemeContext";

/* ── Section wrapper ── */
function Section({ title, children }) {
  return (
    <div className="border-b border-[var(--border)] px-5 py-5">
      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)]">{title}</p>
      {children}
    </div>
  );
}

/* ── Toggle switch ── */
function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative h-6 w-11 rounded-full transition-colors duration-200"
      style={{ backgroundColor: checked ? "var(--accent)" : "rgba(255,255,255,0.12)" }}
    >
      <span
        className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }}
      />
    </button>
  );
}

/* ── Avatar ── */
function AvatarBlock({ profile, user, onUpload, uploading }) {
  const fileRef = useRef(null);
  const initial = (profile?.username || user?.email || "?")[0].toUpperCase();

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0">
        <div
          className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 text-xl font-bold text-white"
          style={{ borderColor: "var(--accent)", backgroundColor: "rgba(var(--accent-rgb),0.18)" }}
        >
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt="avatar" className="h-full w-full object-cover" />
            : <span style={{ color: "var(--accent-light)" }}>{initial}</span>
          }
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-surface)] text-white/60 transition hover:text-white"
          title="Changer l'avatar"
        >
          {uploading
            ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
            : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          }
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])} />
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold text-[var(--text-primary)]">
          {profile?.username || "Aucun pseudo"}
        </p>
        <p className="truncate text-sm text-[var(--text-muted)]">{user?.email}</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ACCOUNT PAGE
   ══════════════════════════════════════════════════════ */
export default function AccountPage({ onClose }) {
  const { user, signOut, updatePassword } = useAuth();
  const { profile, loading, update, uploadAvatar, deleteAccount } = useProfile();
  const { accent, theme, setAccent, setTheme } = useTheme();

  const [username,    setUsername]    = useState("");
  const [saving,      setSaving]      = useState(false);
  const [saveOk,      setSaveOk]      = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [notify,      setNotify]      = useState(false);
  const [showPw,      setShowPw]      = useState(false);
  const [newPw,       setNewPw]       = useState("");
  const [confirmPw,   setConfirmPw]   = useState("");
  const [pwSaving,    setPwSaving]    = useState(false);
  const [pwMsg,       setPwMsg]       = useState("");
  const [deleteStep,  setDeleteStep]  = useState(0); // 0=hidden 1=confirm 2=deleting
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (!profile) return;
    setUsername(profile.username || "");
    setNotify(profile.notify_forte_picks || false);
  }, [profile]);

  async function handleSaveProfile() {
    setSaving(true);
    await update({ username: username.trim() || null });
    setSaving(false);
    setSaveOk(true);
    setTimeout(() => setSaveOk(false), 2000);
  }

  async function handleUpload(file) {
    setUploading(true);
    await uploadAvatar(file);
    setUploading(false);
  }

  async function handleNotifyToggle(val) {
    setNotify(val);
    await update({ notify_forte_picks: val });
  }

  async function handleChangePassword() {
    if (newPw !== confirmPw) { setPwMsg("Les mots de passe ne correspondent pas."); return; }
    if (newPw.length < 6)    { setPwMsg("Minimum 6 caractères."); return; }
    setPwSaving(true);
    const error = await updatePassword(newPw);
    setPwSaving(false);
    if (error) { setPwMsg(error.message); }
    else { setPwMsg("✓ Mot de passe modifié."); setNewPw(""); setConfirmPw(""); setTimeout(() => { setPwMsg(""); setShowPw(false); }, 2000); }
  }

  async function handleDelete() {
    setDeleteStep(2);
    setDeleteError("");
    const error = await deleteAccount();
    if (error) { setDeleteError(error.message); setDeleteStep(1); }
    // signOut is called inside deleteAccount
  }

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        className="relative flex h-full w-full flex-col overflow-y-auto sm:max-w-md anim-slide-right pb-16 sm:pb-0"
        style={{ backgroundColor: "var(--bg-base)" }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b px-5 py-4"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent-light)" }}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Mon compte</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 transition hover:bg-white/[0.07]" style={{ color: "var(--text-muted)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-white/60" />
          </div>
        ) : (
          <>
            {/* Avatar + identité */}
            <div className="border-b px-5 py-5" style={{ borderColor: "var(--border)" }}>
              <AvatarBlock profile={profile} user={user} onUpload={handleUpload} uploading={uploading} />
            </div>

            {/* ── Profil ── */}
            <Section title="Profil">
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs text-[var(--text-secondary)]">Pseudo</label>
                  <div className="flex gap-2">
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Ton pseudo..."
                      maxLength={32}
                      className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)]"
                      style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                    />
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition"
                      style={{ backgroundColor: saveOk ? "#22c55e" : "var(--accent)" }}
                    >
                      {saveOk ? "✓" : saving ? "…" : "Sauvegarder"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs text-[var(--text-secondary)]">Email</label>
                  <div
                    className="rounded-lg border px-3 py-2 text-sm"
                    style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}
                  >
                    {user?.email}
                  </div>
                </div>

                {/* Changer le mot de passe */}
                <div>
                  <button
                    onClick={() => { setShowPw(!showPw); setPwMsg(""); }}
                    className="text-xs transition"
                    style={{ color: "var(--accent-light)" }}
                  >
                    {showPw ? "Annuler" : "Changer le mot de passe →"}
                  </button>
                  {showPw && (
                    <div className="mt-3 space-y-2 anim-fade-in">
                      <input
                        type="password"
                        placeholder="Nouveau mot de passe"
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)]"
                        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                      />
                      <input
                        type="password"
                        placeholder="Confirmer"
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)]"
                        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                      />
                      {pwMsg && (
                        <p className={`text-xs ${pwMsg.startsWith("✓") ? "text-emerald-400" : "text-rose-400"}`}>{pwMsg}</p>
                      )}
                      <button
                        onClick={handleChangePassword}
                        disabled={pwSaving}
                        className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition"
                        style={{ backgroundColor: "var(--accent)" }}
                      >
                        {pwSaving ? "…" : "Modifier"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Section>

            {/* ── Apparence ── */}
            <Section title="Apparence">
              {/* Couleur d'accentuation */}
              <div className="mb-5">
                <p className="mb-3 text-sm text-[var(--text-secondary)]">Couleur d'accentuation</p>
                <div className="flex gap-3">
                  {ACCENT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setAccent(opt.id)}
                      title={opt.label}
                      className="relative h-8 w-8 rounded-full transition-transform hover:scale-110"
                      style={{ backgroundColor: opt.main }}
                    >
                      {accent === opt.id && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </span>
                      )}
                      {accent === opt.id && (
                        <span className="absolute -inset-1 rounded-full border-2 border-white/40" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Thème */}
              <div>
                <p className="mb-3 text-sm text-[var(--text-secondary)]">Thème</p>
                <div className="flex gap-2">
                  {[
                    { id: "dark",  label: "🌙 Sombre" },
                    { id: "light", label: "☀️ Clair" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setTheme(opt.id)}
                      className="rounded-lg border px-4 py-2 text-sm font-medium transition"
                      style={{
                        borderColor:     theme === opt.id ? "var(--accent)" : "var(--border)",
                        backgroundColor: theme === opt.id ? "rgba(var(--accent-rgb),0.12)" : "transparent",
                        color:           theme === opt.id ? "var(--accent-light)" : "var(--text-secondary)",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </Section>

            {/* ── Notifications ── */}
            <Section title="Notifications">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">Alertes picks FORTE</p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    Recevoir un email quand une prédiction FORTE concerne une de tes équipes favorites.
                  </p>
                </div>
                <Toggle checked={notify} onChange={handleNotifyToggle} />
              </div>
            </Section>

            {/* ── Déconnexion ── */}
            <Section title="Session">
              <button
                onClick={() => { signOut(); onClose(); }}
                className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition hover:opacity-80"
                style={{ borderColor: "rgba(255,255,255,0.1)", color: "var(--text-secondary)" }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Se déconnecter
              </button>
            </Section>

            {/* ── Zone dangereuse ── */}
            <Section title="Zone dangereuse">
              {deleteStep === 0 && (
                <button
                  onClick={() => setDeleteStep(1)}
                  className="rounded-lg border border-rose-500/30 bg-rose-500/8 px-4 py-2.5 text-sm font-medium text-rose-400 transition hover:bg-rose-500/15"
                >
                  Supprimer mon compte
                </button>
              )}

              {deleteStep === 1 && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/8 p-4 anim-fade-in">
                  <p className="mb-1 font-semibold text-rose-300">Tu es sûr ?</p>
                  <p className="mb-4 text-xs text-rose-400/70">
                    Toutes tes données (favoris, carnet de paris, profil) seront supprimées définitivement.
                  </p>
                  {deleteError && <p className="mb-3 text-xs text-rose-400">{deleteError}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={handleDelete}
                      className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
                    >
                      Oui, supprimer
                    </button>
                    <button
                      onClick={() => setDeleteStep(0)}
                      className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/50 transition hover:bg-white/[0.05]"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              {deleteStep === 2 && (
                <div className="flex items-center gap-3 text-sm text-rose-400">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-rose-400/20 border-t-rose-400" />
                  Suppression en cours…
                </div>
              )}
            </Section>
          </>
        )}
      </div>
    </div>
  );
}
