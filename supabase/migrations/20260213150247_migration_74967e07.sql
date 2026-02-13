-- Update transcripts table to match new schema

-- 1. Rename content to full_text
ALTER TABLE transcripts RENAME COLUMN content TO full_text;

-- 2. Add new columns
ALTER TABLE transcripts 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS language TEXT,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Backfill data (if any) - infer project/user from media_file
-- This is a bit complex in SQL only, so we'll just allow NULLs for now and let the application handle new ones correctly.
-- But for strictness, let's try to update based on media_files
UPDATE transcripts t
SET 
  project_id = m.project_id,
  user_id = m.user_id
FROM media_files m
WHERE t.media_file_id = m.id
AND (t.project_id IS NULL OR t.user_id IS NULL);

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_transcripts_project ON transcripts(project_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_user ON transcripts(user_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_status ON transcripts(status);