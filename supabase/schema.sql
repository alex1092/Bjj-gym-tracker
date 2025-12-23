-- BJJ Attendance Tracker Database Schema
-- Run this in your Supabase SQL Editor

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create gyms table
CREATE TABLE IF NOT EXISTS public.gyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  address TEXT,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS attendance_user_id_idx ON public.attendance(user_id);
CREATE INDEX IF NOT EXISTS attendance_gym_id_idx ON public.attendance(gym_id);
CREATE INDEX IF NOT EXISTS attendance_checked_in_at_idx ON public.attendance(checked_in_at DESC);
CREATE INDEX IF NOT EXISTS gyms_slug_idx ON public.gyms(slug);
CREATE INDEX IF NOT EXISTS gyms_owner_id_idx ON public.gyms(owner_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Gym owners can view profiles of users who attended their gym
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

-- Gyms policies (public read access)
CREATE POLICY "Anyone can view gyms"
  ON public.gyms
  FOR SELECT
  USING (true);

-- Gym owners can update their own gyms
CREATE POLICY "Owners can update their gyms"
  ON public.gyms
  FOR UPDATE
  USING (owner_id = auth.uid());

-- Attendance policies
CREATE POLICY "Users can view their own attendance"
  ON public.attendance
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attendance"
  ON public.attendance
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

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

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert a sample gym (replace with your actual gym)
-- INSERT INTO public.gyms (name, slug, address, owner_id) VALUES ('My BJJ Gym', 'my-bjj-gym', '123 Main St', 'your-user-id');
