-- Allow users to view profiles for reviews
-- This enables displaying reviewer names in book reviews
CREATE POLICY "Profiles are viewable by everyone for reviews"
ON public.profiles
FOR SELECT
USING (true);