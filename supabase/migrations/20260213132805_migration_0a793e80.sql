-- Create storage policies for media bucket
CREATE POLICY "Users can view their own media"
ON storage.objects FOR SELECT
USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own media"
ON storage.objects FOR DELETE
USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);