import "server-only";
import { createClient } from "@supabase/supabase-js";

export const COURSE_HANDOUT_BUCKET = process.env.SUPABASE_HANDOUT_BUCKET || "course-handouts";

export function supabaseStorageAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) throw new Error("尚未設定 Supabase Storage 伺服器憑證。");
  return createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
