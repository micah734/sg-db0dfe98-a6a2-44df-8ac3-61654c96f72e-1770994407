-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view their own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- Folders policies
CREATE POLICY "Users can view folders in their projects" ON folders FOR SELECT 
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = folders.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert folders in their projects" ON folders FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = folders.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update folders in their projects" ON folders FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = folders.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete folders in their projects" ON folders FOR DELETE 
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = folders.project_id AND projects.user_id = auth.uid()));

-- Documents policies
CREATE POLICY "Users can view their own documents" ON documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own documents" ON documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own documents" ON documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own documents" ON documents FOR DELETE USING (auth.uid() = user_id);

-- Media files policies
CREATE POLICY "Users can view their own media files" ON media_files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own media files" ON media_files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own media files" ON media_files FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own media files" ON media_files FOR DELETE USING (auth.uid() = user_id);

-- Transcripts policies
CREATE POLICY "Users can view transcripts for their media" ON transcripts FOR SELECT 
  USING (EXISTS (SELECT 1 FROM media_files WHERE media_files.id = transcripts.media_file_id AND media_files.user_id = auth.uid()));
CREATE POLICY "Users can insert transcripts for their media" ON transcripts FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM media_files WHERE media_files.id = transcripts.media_file_id AND media_files.user_id = auth.uid()));
CREATE POLICY "Users can update transcripts for their media" ON transcripts FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM media_files WHERE media_files.id = transcripts.media_file_id AND media_files.user_id = auth.uid()));
CREATE POLICY "Users can delete transcripts for their media" ON transcripts FOR DELETE 
  USING (EXISTS (SELECT 1 FROM media_files WHERE media_files.id = transcripts.media_file_id AND media_files.user_id = auth.uid()));

-- Annotations policies
CREATE POLICY "Users can view their own annotations" ON annotations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own annotations" ON annotations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own annotations" ON annotations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own annotations" ON annotations FOR DELETE USING (auth.uid() = user_id);

-- Embeddings policies
CREATE POLICY "Users can view embeddings in their projects" ON embeddings FOR SELECT 
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = embeddings.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert embeddings in their projects" ON embeddings FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = embeddings.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete embeddings in their projects" ON embeddings FOR DELETE 
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = embeddings.project_id AND projects.user_id = auth.uid()));