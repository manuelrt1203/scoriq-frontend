import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./AuthContext";

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

  return { bets, loading, addBet, updateResult, deleteBet, stats };
}
