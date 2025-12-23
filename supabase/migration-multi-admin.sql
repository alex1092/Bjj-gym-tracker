-- Migration: Add multi-admin support for gyms
-- Run this in your Supabase SQL Editor

-- Create gym_admins junction table
CREATE TABLE IF NOT EXISTS public.gym_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('owner', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(gym_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS gym_admins_gym_id_idx ON public.gym_admins(gym_id);
CREATE INDEX IF NOT EXISTS gym_admins_user_id_idx ON public.gym_admins(user_id);

-- Enable RLS
ALTER TABLE public.gym_admins ENABLE ROW LEVEL SECURITY;

-- Gym admins can view their own admin records
CREATE POLICY "Users can view their gym admin roles"
  ON public.gym_admins
  FOR SELECT
  USING (user_id = auth.uid());

-- Migrate existing owner_id to gym_admins table
INSERT INTO public.gym_admins (gym_id, user_id, role)
SELECT id, owner_id, 'owner'
FROM public.gyms
WHERE owner_id IS NOT NULL
ON CONFLICT (gym_id, user_id) DO NOTHING;

-- Update attendance policy to use gym_admins
DROP POLICY IF EXISTS "Gym owners can view attendance" ON public.attendance;
CREATE POLICY "Gym admins can view attendance"
  ON public.attendance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.gym_admins
      WHERE gym_admins.gym_id = attendance.gym_id
      AND gym_admins.user_id = auth.uid()
    )
  );

-- Update profiles policy to use gym_admins
DROP POLICY IF EXISTS "Gym owners can view member profiles" ON public.profiles;
CREATE POLICY "Gym admins can view member profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.gym_admins ga
      JOIN public.attendance a ON a.gym_id = ga.gym_id
      WHERE ga.user_id = auth.uid()
      AND a.user_id = profiles.id
    )
  );

-- Add the two admin users to test-gym
-- Replace 'test-gym' with your actual gym slug if different
INSERT INTO public.gym_admins (gym_id, user_id, role)
SELECT g.id, 'a7ea0cb1-10e8-43bd-a2f7-1687ff795217', 'owner'
FROM public.gyms g WHERE g.slug = 'test-gym'
ON CONFLICT (gym_id, user_id) DO NOTHING;

INSERT INTO public.gym_admins (gym_id, user_id, role)
SELECT g.id, '5ad0a56b-4dd6-4c79-a280-b94f9d45a112', 'admin'
FROM public.gyms g WHERE g.slug = 'test-gym'
ON CONFLICT (gym_id, user_id) DO NOTHING;
