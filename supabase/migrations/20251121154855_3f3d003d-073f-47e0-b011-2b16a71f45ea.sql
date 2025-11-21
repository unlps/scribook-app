-- Add likes/dislikes tracking for reviews
CREATE TABLE IF NOT EXISTS public.review_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Enable RLS
ALTER TABLE public.review_reactions ENABLE ROW LEVEL SECURITY;

-- Policies for review_reactions
CREATE POLICY "Anyone can view reactions"
ON public.review_reactions FOR SELECT
USING (true);

CREATE POLICY "Users can add their own reactions"
ON public.review_reactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reactions"
ON public.review_reactions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
ON public.review_reactions FOR DELETE
USING (auth.uid() = user_id);

-- Add columns to reviews for counts (denormalized for performance)
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS dislikes_count integer DEFAULT 0;

-- Function to update reaction counts
CREATE OR REPLACE FUNCTION update_review_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.reaction_type = 'like' THEN
      UPDATE public.reviews SET likes_count = likes_count + 1 WHERE id = NEW.review_id;
    ELSE
      UPDATE public.reviews SET dislikes_count = dislikes_count + 1 WHERE id = NEW.review_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.reaction_type = 'like' AND NEW.reaction_type = 'dislike' THEN
      UPDATE public.reviews SET likes_count = likes_count - 1, dislikes_count = dislikes_count + 1 WHERE id = NEW.review_id;
    ELSIF OLD.reaction_type = 'dislike' AND NEW.reaction_type = 'like' THEN
      UPDATE public.reviews SET likes_count = likes_count + 1, dislikes_count = dislikes_count - 1 WHERE id = NEW.review_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.reaction_type = 'like' THEN
      UPDATE public.reviews SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.review_id;
    ELSE
      UPDATE public.reviews SET dislikes_count = GREATEST(dislikes_count - 1, 0) WHERE id = OLD.review_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_review_reaction_counts_trigger ON public.review_reactions;
CREATE TRIGGER update_review_reaction_counts_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.review_reactions
FOR EACH ROW EXECUTE FUNCTION update_review_reaction_counts();