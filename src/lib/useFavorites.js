import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./AuthContext";

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("favorites")
      .select("*")
      .eq("user_id", user.id)
      .then(({ data }) => setFavorites(data || []));
  }, [user]);

  function isFav(type, name) {
    return favorites.some((f) => f.type === type && f.name === name);
  }

  async function toggle(type, name) {
    if (!user) return;
    if (isFav(type, name)) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("type", type)
        .eq("name", name);
      setFavorites((prev) => prev.filter((f) => !(f.type === type && f.name === name)));
    } else {
      const { data } = await supabase
        .from("favorites")
        .insert({ user_id: user.id, type, name })
        .select()
        .single();
      if (data) setFavorites((prev) => [...prev, data]);
    }
  }

  const favTeams        = favorites.filter((f) => f.type === "team").map((f) => f.name);
  const favCompetitions = favorites.filter((f) => f.type === "competition").map((f) => f.name);

  return { favorites, favTeams, favCompetitions, isFav, toggle };
}
