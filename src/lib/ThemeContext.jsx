import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "./supabase";

const ThemeContext = createContext(null);

export const ACCENT_OPTIONS = [
  { id: "green",  label: "Vert",   main: "#10b981", light: "#34d399", lighter: "#6ee7b7", dark: "#059669", rgb: "16,185,129" },
  { id: "blue",   label: "Bleu",   main: "#3b82f6", light: "#60a5fa", lighter: "#93c5fd", dark: "#2563eb", rgb: "59,130,246" },
  { id: "orange", label: "Orange", main: "#f97316", light: "#fb923c", lighter: "#fdba74", dark: "#ea580c", rgb: "249,115,22" },
  { id: "violet", label: "Violet", main: "#8b5cf6", light: "#a78bfa", lighter: "#c4b5fd", dark: "#7c3aed", rgb: "139,92,246" },
  { id: "pink",   label: "Rose",   main: "#ec4899", light: "#f472b6", lighter: "#f9a8d4", dark: "#db2777", rgb: "236,72,153" },
];

function applyToDOM(theme, accent) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.setAttribute("data-accent", accent);
  const color = ACCENT_OPTIONS.find((c) => c.id === accent) || ACCENT_OPTIONS[0];
  root.style.setProperty("--accent", color.main);
  root.style.setProperty("--accent-light", color.light);
  root.style.setProperty("--accent-lighter", color.lighter);
  root.style.setProperty("--accent-dark", color.dark);
  root.style.setProperty("--accent-rgb", color.rgb);
}

export function ThemeProvider({ children }) {
  const { user } = useAuth();
  const [accent, setAccentState] = useState(() => localStorage.getItem("scoriq_accent") || "green");
  const [theme,  setThemeState]  = useState(() => localStorage.getItem("scoriq_theme")  || "dark");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("accent_color, theme").eq("user_id", user.id).single()
      .then(({ data }) => {
        if (data?.accent_color) setAccentState(data.accent_color);
        if (data?.theme)        setThemeState(data.theme);
      });
  }, [user?.id]);

  useEffect(() => {
    applyToDOM(theme, accent);
    localStorage.setItem("scoriq_accent", accent);
    localStorage.setItem("scoriq_theme",  theme);
  }, [accent, theme]);

  async function setAccent(color) {
    setAccentState(color);
    if (user) await supabase.from("profiles").update({ accent_color: color }).eq("user_id", user.id);
  }

  async function setTheme(t) {
    setThemeState(t);
    if (user) await supabase.from("profiles").update({ theme: t }).eq("user_id", user.id);
  }

  return (
    <ThemeContext.Provider value={{ accent, theme, setAccent, setTheme, ACCENT_OPTIONS }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
