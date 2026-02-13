-- Add columns to support chunked media files
ALTER TABLE media_files
ADD COLUMN total_chunks integer NULL,
ADD COLUMN is_chunked boolean DEFAULT false,
ADD COLUMN chunk_pattern text NULL;

-- Add comment for documentation
COMMENT ON COLUMN media_files.total_chunks IS 'Number of chunks if file was uploaded in parts';
COMMENT ON COLUMN media_files.is_chunked IS 'Whether this file is stored as chunks';
COMMENT ON COLUMN media_files.chunk_pattern IS 'Storage path pattern for chunks (e.g., userId/projectId/filename.part{N})';