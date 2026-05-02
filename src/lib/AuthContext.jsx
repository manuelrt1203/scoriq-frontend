import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]                   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setPasswordRecovery(true);
      } else {
        setUser(session?.user ?? null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (!error && data?.user) {
      // Géolocalisation IP en arrière-plan (sans bloquer l'UX)
      captureSignupMeta(data.user.id, email).catch(() => {});
    }
    return error;
  }

  async function captureSignupMeta(userId, email) {
    let geo = {};
    try {
      const res = await fetch("https://ipapi.co/json/");
      if (res.ok) {
        const d = await res.json();
        geo = { signup_ip: d.ip, country: d.country_name, city: d.city };
      }
    } catch (_) {}

    // Sauvegarder dans profiles
    await supabase.from("profiles").upsert({
      user_id: userId,
      signup_at: new Date().toISOString(),
      ...geo,
    }, { onConflict: "user_id" });

    // Notifier le backend Railway
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/notify/new-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, ...geo }),
      });
    } catch (_) {}
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    return error;
  }

  async function updatePassword(password) {
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) setPasswordRecovery(false);
    return error;
  }

  return (
    <AuthContext.Provider value={{ user, loading, passwordRecovery, signUp, signIn, signOut, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
