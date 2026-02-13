-- Add file_size column to media_files table
ALTER TABLE media_files 
ADD COLUMN file_size bigint NULL;

-- Add comment for documentation
COMMENT ON COLUMN media_files.file_size IS 'File size in bytes';