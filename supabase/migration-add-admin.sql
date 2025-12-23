-- Migration: Add gym owner support
-- Run this in your Supabase SQL Editor

-- Add owner_id column to gyms
ALTER TABLE public.gyms
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create index for owner lookups
CREATE INDEX IF NOT EXISTS gyms_owner_id_idx ON public.gyms(owner_id);

-- Allow gym owners to view profiles of users who attended their gym
CREATE POLICY "Gym owners can view member profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.gyms g
      JOIN public.attendance a ON a.gym_id = g.id
      WHERE g.owner_id = auth.uid()
      AND a.user_id = profiles.id
    )
  );

-- Gym owners can update their own gyms
CREATE POLICY "Owners can update their gyms"
  ON public.gyms
  FOR UPDATE
  USING (owner_id = auth.uid());

-- Gym owners can view attendance at their gyms
CREATE POLICY "Gym owners can view attendance"
  ON public.attendance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.gyms
      WHERE gyms.id = attendance.gym_id
      AND gyms.owner_id = auth.uid()
    )
  );

-- To set yourself as the owner of a gym, run:
-- UPDATE public.gyms SET owner_id = 'YOUR-USER-ID' WHERE slug = 'your-gym-slug';
--
-- You can find your user ID in Supabase Dashboard > Authentication > Users
