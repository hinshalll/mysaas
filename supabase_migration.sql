-- Creem.io Subscription Fields Migration
-- Run this in your Supabase Dashboard SQL Editor (https://database.new)

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- Update the check constraint to support the new 'api' plan tier
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_tier_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_tier_check CHECK (tier IN ('free', 'pro', 'admin', 'api'));

-- Ensure RLS (Row Level Security) exists and allow service_role to bypass,
-- and standard users to only read their own subscription data.
-- (Supabase handles service_role bypass automatically, but we can verify RLS is active)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

