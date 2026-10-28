// supabaseClient.js — shared client, imported anywhere data is needed.
//
// The URL and anon key below are PUBLIC by design (same values your old
// supabase.js had written in directly) — Supabase's row-level security
// policies are what actually protect the data, not hiding these. They're
// used as a fallback so the site works even if Cloudflare's build doesn't
// receive the VITE_ environment variables. If those variables ARE set,
// they take priority.
import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://zpkswhucfdldibtltuxg.supabase.co'
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa3N3aHVjZmRsZGlidGx0dXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MDY4NzgsImV4cCI6MjA5MTQ4Mjg3OH0.4HdSswYWbrLhkGXvKt_ZfyRQZFVzukgpT2Lq1-bDAV0'

export const supabase = createClient(supabaseUrl, supabaseKey)
