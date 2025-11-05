-- Add new columns to ebooks table
ALTER TABLE public.ebooks
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS price decimal(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS genre text,
ADD COLUMN IF NOT EXISTS formats text[] DEFAULT ARRAY['PDF'],
ADD COLUMN IF NOT EXISTS published_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS rating decimal(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS preview_content text;

-- Create genres table
CREATE TABLE IF NOT EXISTS public.genres (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert default genres
INSERT INTO public.genres (name) VALUES 
  ('Ficção'),
  ('Não-ficção'),
  ('Romance'),
  ('Mistério'),
  ('Fantasia'),
  ('Biografia'),
  ('História'),
  ('Tecnologia'),
  ('Autoajuda'),
  ('Infantil')
ON CONFLICT (name) DO NOTHING;

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ebook_id uuid NOT NULL REFERENCES public.ebooks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create wishlist table
CREATE TABLE IF NOT EXISTS public.wishlist (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ebook_id uuid NOT NULL REFERENCES public.ebooks(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, ebook_id)
);

-- Enable RLS on new tables
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;

-- RLS policies for genres (public read)
CREATE POLICY "Genres are viewable by everyone"
ON public.genres FOR SELECT
USING (true);

-- RLS policies for reviews
CREATE POLICY "Reviews are viewable by everyone"
ON public.reviews FOR SELECT
USING (true);

CREATE POLICY "Users can create reviews"
ON public.reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
ON public.reviews FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
ON public.reviews FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for wishlist
CREATE POLICY "Users can view own wishlist"
ON public.wishlist FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to wishlist"
ON public.wishlist FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from wishlist"
ON public.wishlist FOR DELETE
USING (auth.uid() = user_id);

-- Update ebooks RLS to allow public read for public books
CREATE POLICY "Public ebooks are viewable by everyone"
ON public.ebooks FOR SELECT
USING (is_public = true OR auth.uid() = user_id);

-- Create function to update ebook rating
CREATE OR REPLACE FUNCTION public.update_ebook_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.ebooks
  SET rating = (
    SELECT AVG(rating)::decimal(3,2)
    FROM public.reviews
    WHERE ebook_id = NEW.ebook_id
  )
  WHERE id = NEW.ebook_id;
  RETURN NEW;
END;
$$;

-- Trigger to update rating when review is added/updated
CREATE TRIGGER update_ebook_rating_trigger
AFTER INSERT OR UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_ebook_rating();