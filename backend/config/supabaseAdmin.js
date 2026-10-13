import { createClient } from '@supabase/supabase-js'

// Csak szerveroldalon használható! A service role kulcs megkerüli az RLS-t,
// ezért soha nem kerülhet a frontendre.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
)