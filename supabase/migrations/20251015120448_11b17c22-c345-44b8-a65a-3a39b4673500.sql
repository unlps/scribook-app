-- Create chapters table
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ebook_id UUID NOT NULL REFERENCES public.ebooks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  chapter_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chapters
CREATE POLICY "Users can view chapters of their ebooks"
  ON public.chapters
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ebooks
      WHERE ebooks.id = chapters.ebook_id
      AND ebooks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create chapters for their ebooks"
  ON public.chapters
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ebooks
      WHERE ebooks.id = chapters.ebook_id
      AND ebooks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update chapters of their ebooks"
  ON public.chapters
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.ebooks
      WHERE ebooks.id = chapters.ebook_id
      AND ebooks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete chapters of their ebooks"
  ON public.chapters
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.ebooks
      WHERE ebooks.id = chapters.ebook_id
      AND ebooks.user_id = auth.uid()
    )
  );

-- Create index for better query performance
CREATE INDEX idx_chapters_ebook_id ON public.chapters(ebook_id);
CREATE INDEX idx_chapters_order ON public.chapters(ebook_id, chapter_order);