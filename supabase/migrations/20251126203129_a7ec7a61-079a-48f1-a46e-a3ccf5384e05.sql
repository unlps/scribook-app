-- Add username (unique) and social_link fields to profiles
ALTER TABLE public.profiles
ADD COLUMN username TEXT UNIQUE,
ADD COLUMN social_link TEXT;

-- Create index for username lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Add comment for username
COMMENT ON COLUMN public.profiles.username IS 'Unique username for the user profile';