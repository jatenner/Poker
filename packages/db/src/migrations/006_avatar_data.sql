-- Add avatar_data JSONB column to profiles for caricature avatar storage
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_data jsonb;
