// =====================================
// Auth Check Script
// =====================================
// This script runs BEFORE the main app script
// to ensure users are authenticated before any app code executes

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = 'https://abfuanjincelcyrlswsp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiZnVhbmppbmNlbGN5cmxzd3NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NjE4MDIsImV4cCI6MjA4MzQzNzgwMn0.OD7371E7A1ZRiqF6SGXnp2JSzPowg2zTt-V36GQ7x9A'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Check authentication immediately
const { data: { session } } = await supabase.auth.getSession()

if (!session) {
  // Not authenticated - redirect to login
  window.location.replace('index.html')
  // Stop all further script execution
  throw new Error('Not authenticated')
}

// Export supabase client and session for use in main app
export { supabase, session }