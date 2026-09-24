import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dczmcvgrvljoxarnruyf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjem1jdmdydmxqb3hhcm5ydXlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxOTAxNjQsImV4cCI6MjEwNTc2NjE2NH0.lpJmsvS4TcdAd3m8A7cReDBYSOZ9cwfOhM-bS_DTWUI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: { params: { eventsPerSecond: 1 } },
})
