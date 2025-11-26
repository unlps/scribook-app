-- Create user_follows table for social network
CREATE TABLE public.user_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable RLS
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_follows
CREATE POLICY "Users can follow others"
ON public.user_follows
FOR INSERT
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
ON public.user_follows
FOR DELETE
USING (auth.uid() = follower_id);

CREATE POLICY "Anyone can view follows"
ON public.user_follows
FOR SELECT
USING (true);

-- Add is_private field to profiles
ALTER TABLE public.profiles
ADD COLUMN is_private BOOLEAN DEFAULT false;

-- Add bio field for author information
ALTER TABLE public.profiles
ADD COLUMN bio TEXT;

-- Create purchases table for simulated payments
CREATE TABLE public.purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ebook_id UUID NOT NULL REFERENCES public.ebooks(id) ON DELETE CASCADE,
  purchase_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  price NUMERIC NOT NULL DEFAULT 0,
  UNIQUE(user_id, ebook_id)
);

-- Enable RLS
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for purchases
CREATE POLICY "Users can create purchases"
ON public.purchases
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own purchases"
ON public.purchases
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON public.user_follows(following_id);
CREATE INDEX idx_purchases_user ON public.purchases(user_id);
CREATE INDEX idx_purchases_ebook ON public.purchases(ebook_id);