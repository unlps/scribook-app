-- Fix search_path security issue
CREATE OR REPLACE FUNCTION update_review_reaction_counts()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;