-- Create storage bucket for ebook uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('ebook-uploads', 'ebook-uploads', false);

-- Create storage bucket for ebook covers
INSERT INTO storage.buckets (id, name, public)
VALUES ('ebook-covers', 'ebook-covers', true);

-- RLS policies for ebook-uploads bucket
CREATE POLICY "Users can upload their own files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'ebook-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own uploads"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'ebook-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own uploads"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'ebook-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS policies for ebook-covers bucket
CREATE POLICY "Anyone can view covers"
ON storage.objects
FOR SELECT
USING (bucket_id = 'ebook-covers');

CREATE POLICY "Users can upload their own covers"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'ebook-covers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own covers"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'ebook-covers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own covers"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'ebook-covers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);