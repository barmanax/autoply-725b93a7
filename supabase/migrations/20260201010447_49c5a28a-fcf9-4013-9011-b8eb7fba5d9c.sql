-- Add profile fields for application auto-fill
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS graduation_date date,
ADD COLUMN IF NOT EXISTS race text,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS work_authorization text,
ADD COLUMN IF NOT EXISTS other_info text;