import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "./supabase";

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setProfile(null); setLoading(false); return; }
    load();
  }, [user?.id]);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
    if (!data) {
      const { data: created } = await supabase.from("profiles").insert({ user_id: user.id }).select().single();
      setProfile(created);
    } else {
      setProfile(data);
    }
    setLoading(false);
  }

  async function update(changes) {
    const { data, error } = await supabase
      .from("profiles")
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .select()
      .single();
    if (!error) setProfile(data);
    return error;
  }

  async function uploadAvatar(file) {
    const ext = file.name.split(".").pop().toLowerCase();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) return error;
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    return update({ avatar_url: `${publicUrl}?t=${Date.now()}` });
  }

  async function deleteAccount() {
    await supabase.from("favorites").delete().eq("user_id", user.id);
    await supabase.from("bets").delete().eq("user_id", user.id);
    const { error } = await supabase.rpc("delete_user");
    if (!error) await supabase.auth.signOut();
    return error;
  }

  return { profile, loading, update, uploadAvatar, deleteAccount };
}
