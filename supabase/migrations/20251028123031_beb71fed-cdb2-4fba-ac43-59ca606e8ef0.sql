-- Add RLS policies for storage buckets

-- Policies for ebook-uploads bucket (private bucket for user file uploads)
CREATE POLICY "Users can upload own files to ebook-uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ebook-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read own files from ebook-uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'ebook-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own files in ebook-uploads"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ebook-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own files from ebook-uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'ebook-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policies for ebook-covers bucket (public bucket for cover images)
CREATE POLICY "Anyone can view ebook covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'ebook-covers');

CREATE POLICY "Users can upload own covers to ebook-covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ebook-covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own covers in ebook-covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ebook-covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own covers from ebook-covers"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'ebook-covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);