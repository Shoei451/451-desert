-- =====================================================
-- Focus Timer App - Supabase Database Setup
-- =====================================================
-- This script creates the necessary tables and policies
-- for the Focus Timer application
-- =====================================================

-- Categories Table
-- Stores user-defined focus categories (Study, Coding, etc.)
CREATE TABLE IF NOT EXISTS focus_categories (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Sessions Table
-- Stores completed focus sessions
CREATE TABLE IF NOT EXISTS focus_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD format for easy filtering
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings Table
-- Stores user preferences
CREATE TABLE IF NOT EXISTS focus_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{
    "autoStartBreak": false,
    "soundEnabled": true,
    "breakDuration": 5
  }'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Index for faster category lookups
CREATE INDEX IF NOT EXISTS idx_focus_categories_user 
  ON focus_categories(user_id);

-- Index for faster session queries by user and date
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_date 
  ON focus_sessions(user_id, date DESC);

-- Index for faster session queries by user and start time
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_time 
  ON focus_sessions(user_id, start_time DESC);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE focus_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own categories" ON focus_categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON focus_categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON focus_categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON focus_categories;

DROP POLICY IF EXISTS "Users can view their own sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON focus_sessions;

DROP POLICY IF EXISTS "Users can view their own settings" ON focus_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON focus_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON focus_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON focus_settings;

-- Categories Policies
CREATE POLICY "Users can view their own categories"
  ON focus_categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
  ON focus_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON focus_categories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON focus_categories FOR DELETE
  USING (auth.uid() = user_id);

-- Sessions Policies
CREATE POLICY "Users can view their own sessions"
  ON focus_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON focus_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON focus_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON focus_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Settings Policies
CREATE POLICY "Users can view their own settings"
  ON focus_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON focus_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON focus_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings"
  ON focus_settings FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Functions and Triggers
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on settings changes
DROP TRIGGER IF EXISTS update_focus_settings_updated_at ON focus_settings;
CREATE TRIGGER update_focus_settings_updated_at
  BEFORE UPDATE ON focus_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Complete! 
-- =====================================================
-- Your Focus Timer database is now ready to use.
-- Next steps:
-- 1. Ensure your Supabase project URL and anon key are correct in the app
-- 2. Deploy the HTML, CSS, and JS files
-- 3. Start tracking your focus time!
