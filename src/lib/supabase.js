import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://epmgjyiqcjklfjibrxhz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_qGMZeILKhWfAC9dDQUn32Q_kwhaoGst";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
