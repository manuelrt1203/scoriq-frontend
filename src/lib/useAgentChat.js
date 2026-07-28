import { useCallback, useRef, useState } from "react";
import { supabase } from "./supabase";

const API_BASE = "https://scoriq-backend.onrender.com";
const MAX_ROUNDS = 6;

/**
 * Pilote la conversation avec l'agent IA côté backend (/agent/chat).
 * `handlers` doit exposer les actions "client" que l'agent peut déclencher :
 * isFavorite, toggleFavorite, listFavorites, getProfile, updateProfile, switchTab, openMatch.
 */
export function useAgentChat(handlers) {
  const [thread, setThread] = useState([]); // [{ role: "user"|"assistant", text }]
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const conversationRef = useRef([]); // historique complet au format Anthropic

  const runClientTool = useCallback(
    async (name, input) => {
      try {
        switch (name) {
          case "add_favorite":
            if (!handlers.isFavorite(input.type, input.name)) {
              await handlers.toggleFavorite(input.type, input.name);
            }
            return { ok: true };
          case "remove_favorite":
            if (handlers.isFavorite(input.type, input.name)) {
              await handlers.toggleFavorite(input.type, input.name);
            }
            return { ok: true };
          case "list_favorites":
            return handlers.listFavorites();
          case "get_profile":
            return handlers.getProfile();
          case "update_profile": {
            const err = await handlers.updateProfile(input);
            return err ? { error: String(err.message || err) } : { ok: true };
          }
          case "switch_tab":
            handlers.switchTab(input.tab);
            return { ok: true };
          case "open_match":
            handlers.openMatch(input.home, input.away, input.date);
            return { ok: true };
          default:
            return { error: `Outil client inconnu: ${name}` };
        }
      } catch (e) {
        return { error: String(e?.message || e) };
      }
    },
    [handlers]
  );

  const postChat = useCallback(async (messages) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const res = await fetch(`${API_BASE}/agent/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ messages }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || `L'assistant a rencontré un problème (${res.status}).`);
    }
    return res.json();
  }, []);

  function extractText(messages) {
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (!last) return "";
    return (last.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
  }

  const send = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;

      setError(null);
      setBusy(true);
      setThread((h) => [...h, { role: "user", text: trimmed }]);

      let messages = [...conversationRef.current, { role: "user", content: trimmed }];

      try {
        for (let round = 0; round < MAX_ROUNDS; round++) {
          const data = await postChat(messages);
          messages = data.messages;

          if (data.done) {
            conversationRef.current = messages;
            const reply = extractText(messages) || "…";
            setThread((h) => [...h, { role: "assistant", text: reply }]);
            return;
          }

          const toolResults = [];
          for (const call of data.pending_tool_calls) {
            const result = call.result ?? (await runClientTool(call.name, call.input));
            toolResults.push({
              type: "tool_result",
              tool_use_id: call.id,
              content: JSON.stringify(result),
            });
          }
          messages = [...messages, { role: "user", content: toolResults }];
        }
        throw new Error("L'assistant n'a pas réussi à conclure, réessaie avec une demande plus simple.");
      } catch (e) {
        setError(e?.message || String(e));
        setThread((h) => [...h, { role: "assistant", text: "Désolé, une erreur est survenue. Réessaie dans un instant." }]);
      } finally {
        setBusy(false);
      }
    },
    [busy, postChat, runClientTool]
  );

  return { thread, busy, error, send };
}
