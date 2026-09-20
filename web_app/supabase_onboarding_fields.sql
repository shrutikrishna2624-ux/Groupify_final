-- Add onboarding fields to profiles table
-- This migration adds fields for user onboarding information

-- Add new columns to profiles table if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Student',
ADD COLUMN IF NOT EXISTS year TEXT,
ADD COLUMN IF NOT EXISTS focus_area TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.display_name IS 'User preferred display name for onboarding';
COMMENT ON COLUMN public.profiles.role IS 'User role: Student, Team Lead, Faculty/Mentor, Other';
COMMENT ON COLUMN public.profiles.year IS 'Academic year: First Year, Second Year, Third Year, Final Year, Other';
COMMENT ON COLUMN public.profiles.focus_area IS 'Primary work focus: Web Development, App Development, AI/ML, Cybersecurity, Data Science, Other';
COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Whether user has completed onboarding flow';

-- Create index for faster lookups of users who haven't completed onboarding
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON public.profiles(onboarding_completed);

-- Add GitHub repository URL to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS github_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.projects.github_url IS 'GitHub repository URL for the project code';
