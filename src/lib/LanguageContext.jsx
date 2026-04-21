import { createContext, useContext, useState } from "react";
import { translations } from "./translations";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(
    () => localStorage.getItem("scoriq_lang") || "fr"
  );

  function toggleLang() {
    const next = lang === "fr" ? "en" : "fr";
    localStorage.setItem("scoriq_lang", next);
    setLang(next);
  }

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
