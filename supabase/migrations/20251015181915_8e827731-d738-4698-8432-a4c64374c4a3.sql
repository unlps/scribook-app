-- Add author column to ebooks table
ALTER TABLE public.ebooks 
ADD COLUMN author TEXT;