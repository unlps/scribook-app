-- First, let's check and fix the foreign key relationship
-- Drop the old constraint if it exists
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;

-- Add the correct foreign key that references profiles
ALTER TABLE public.reviews
ADD CONSTRAINT reviews_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Ensure all existing reviews have valid user profiles
-- This will help prevent orphaned reviews
INSERT INTO public.profiles (id, email, full_name)
SELECT DISTINCT r.user_id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', 'Usuário')
FROM public.reviews r
JOIN auth.users u ON r.user_id = u.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = r.user_id
)
ON CONFLICT (id) DO NOTHING;