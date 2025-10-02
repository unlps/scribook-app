-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create ebook types enum
CREATE TYPE public.ebook_type AS ENUM ('standard', 'interactive', 'professional');

-- Create ebooks table
CREATE TABLE public.ebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type ebook_type NOT NULL,
  template_id TEXT,
  pages INTEGER DEFAULT 0,
  file_size TEXT,
  cover_image TEXT,
  views INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.ebooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ebooks"
  ON public.ebooks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own ebooks"
  ON public.ebooks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ebooks"
  ON public.ebooks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ebooks"
  ON public.ebooks FOR DELETE
  USING (auth.uid() = user_id);

-- Create templates table
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type ebook_type NOT NULL,
  thumbnail TEXT,
  suggested_pages TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates are viewable by everyone"
  ON public.templates FOR SELECT
  USING (true);

-- Trigger for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample templates
INSERT INTO public.templates (name, description, type, thumbnail, suggested_pages, category) VALUES
  ('Modern Business', 'Clean and professional design for business content', 'standard', '', '20-50 pages', 'Business'),
  ('Creative Storytelling', 'Engaging layout for narrative content', 'standard', '', '30-100 pages', 'Creative'),
  ('Educational Guide', 'Structured format for learning materials', 'standard', '', '40-80 pages', 'Education'),
  ('Interactive Quiz Book', 'Multimedia ebook with embedded quizzes', 'interactive', '', '15-30 pages', 'Education'),
  ('Video Tutorial', 'Video-rich interactive learning experience', 'interactive', '', '10-25 pages', 'Tutorial'),
  ('Marketing Playbook', 'Professional template for marketing content', 'professional', '', '25-60 pages', 'Marketing'),
  ('Business Proposal', 'Corporate design for professional proposals', 'professional', '', '15-40 pages', 'Business'),
  ('Brand Guidelines', 'Sleek template for brand documentation', 'professional', '', '20-50 pages', 'Branding');