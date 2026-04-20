import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./AuthContext";

const API_BASE = "https://web-production-4b111.up.railway.app";

function normalize(str) {
  return (str || "").toLowerCase().trim();
}

function evaluatePick(pick, result) {
  const { real_home_goals: h, real_away_goals: a, real_total_goals: t, real_btts: btts, real_over_2_5: over25, over_1_5: over15 } = result;
  const real1x2 = h > a ? "1" : h < a ? "2" : "X";
  switch (pick) {
    case "1":        return real1x2 === "1" ? "WIN" : "LOSS";
    case "X":        return real1x2 === "X" ? "WIN" : "LOSS";
    case "2":        return real1x2 === "2" ? "WIN" : "LOSS";
    case "BTTS":     return btts === 1 ? "WIN" : "LOSS";
    case "Over 1.5": return (over15 >= 0.5 || t > 1) ? "WIN" : "LOSS";
    case "Over 2.5": return (over25 === 1 || t > 2) ? "WIN" : "LOSS";
    default:         return null;
  }
}

export function useBets() {
  const { user } = useAuth();
  const [bets, setBets]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("bets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setBets(data || []); setLoading(false); });
  }, [user]);

  async function addBet(bet) {
    const { data, error } = await supabase
      .from("bets")
      .insert({ ...bet, user_id: user.id })
      .select()
      .single();
    if (!error && data) setBets((prev) => [data, ...prev]);
    return error;
  }

  async function updateResult(id, result) {
    const bet  = bets.find((b) => b.id === id);
    const profit = result === "WIN"
      ? parseFloat(((bet.odds - 1) * bet.stake).toFixed(2))
      : result === "LOSS" ? -parseFloat(bet.stake)
      : 0;

    const { error } = await supabase
      .from("bets")
      .update({ result, profit })
      .eq("id", id);

    if (!error) setBets((prev) => prev.map((b) => b.id === id ? { ...b, result, profit } : b));
    return error;
  }

  async function autoEvaluate() {
    const pending = bets.filter((b) => !b.result);
    if (pending.length === 0) return { evaluated: 0 };

    const results = await fetch(`${API_BASE}/results/evaluated?days=30`).then((r) => r.json()).catch(() => []);

    let evaluated = 0;
    for (const bet of pending) {
      const match = results.find((r) =>
        normalize(r.home_team) === normalize(bet.match_home) &&
        normalize(r.away_team) === normalize(bet.match_away)
      );
      if (!match) continue;

      const result = evaluatePick(bet.pick, match);
      if (!result) continue;

      await updateResult(bet.id, result);
      evaluated++;
    }
    return { evaluated };
  }

  async function deleteBet(id) {
    await supabase.from("bets").delete().eq("id", id);
    setBets((prev) => prev.filter((b) => b.id !== id));
  }

  const stats = (() => {
    const evaluated = bets.filter((b) => b.result && b.result !== "VOID");
    const wins      = evaluated.filter((b) => b.result === "WIN").length;
    const profit    = bets.reduce((s, b) => s + (b.profit || 0), 0);
    const staked    = bets.filter((b) => b.stake).reduce((s, b) => s + parseFloat(b.stake), 0);
    return {
      total: bets.length,
      evaluated: evaluated.length,
      wins,
      winRate: evaluated.length ? Math.round(wins / evaluated.length * 100) : null,
      profit: parseFloat(profit.toFixed(2)),
      roi: staked ? parseFloat((profit / staked * 100).toFixed(1)) : null,
    };
  })();

  return { bets, loading, addBet, updateResult, deleteBet, autoEvaluate, stats };
}
