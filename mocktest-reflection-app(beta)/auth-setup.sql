-- ===== Supabase Authentication + RLS Setup =====
-- このファイルをSupabase SQL Editorで実行してください

-- ===== Step 1: 既存のテーブルに user_id カラムを追加 =====
ALTER TABLE mock_exams ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE mock_goals ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE mock_reflections ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE mock_review_tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- ===== Step 2: 既存のpublicポリシーを削除 =====
DROP POLICY IF EXISTS "Allow public read access" ON mock_exams;
DROP POLICY IF EXISTS "Allow public write access" ON mock_exams;
DROP POLICY IF EXISTS "Allow public read access" ON mock_goals;
DROP POLICY IF EXISTS "Allow public write access" ON mock_goals;
DROP POLICY IF EXISTS "Allow public read access" ON mock_reflections;
DROP POLICY IF EXISTS "Allow public write access" ON mock_reflections;
DROP POLICY IF EXISTS "Allow public read access" ON mock_review_tasks;
DROP POLICY IF EXISTS "Allow public write access" ON mock_review_tasks;

-- ===== Step 3: RLSポリシーを作成（各ユーザーは自分のデータのみアクセス可能） =====

-- mock_exams
CREATE POLICY "Users can read own exams"
ON mock_exams FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exams"
ON mock_exams FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exams"
ON mock_exams FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own exams"
ON mock_exams FOR DELETE
USING (auth.uid() = user_id);

-- mock_goals
CREATE POLICY "Users can read own goals"
ON mock_goals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
ON mock_goals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
ON mock_goals FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
ON mock_goals FOR DELETE
USING (auth.uid() = user_id);

-- mock_reflections
CREATE POLICY "Users can read own reflections"
ON mock_reflections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reflections"
ON mock_reflections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reflections"
ON mock_reflections FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reflections"
ON mock_reflections FOR DELETE
USING (auth.uid() = user_id);

-- mock_review_tasks
CREATE POLICY "Users can read own tasks"
ON mock_review_tasks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
ON mock_review_tasks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
ON mock_review_tasks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
ON mock_review_tasks FOR DELETE
USING (auth.uid() = user_id);

-- ===== Step 4: RLSを有効化 =====
ALTER TABLE mock_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_review_tasks ENABLE ROW LEVEL SECURITY;

-- ===== 完了！ =====
-- 次のステップ:
-- 1. Supabase Dashboard → Authentication → Users → Add user でテストユーザーを作成
-- 2. フロントエンドでログイン機能を実装
