import { createClient } from "@supabase/supabase-js";

/** サーバー用 Supabase クライアント（service role key）。Route Handler 内でのみ使用する */
export function createServerSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
