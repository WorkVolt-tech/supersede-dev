// supabase.js — shared client, imported by every page
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

export const supabase = createClient(
  'https://zpkswhucfdldibtltuxg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa3N3aHVjZmRsZGlidGx0dXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MDY4NzgsImV4cCI6MjA5MTQ4Mjg3OH0.4HdSswYWbrLhkGXvKt_ZfyRQZFVzukgpT2Lq1-bDAV0'
)
