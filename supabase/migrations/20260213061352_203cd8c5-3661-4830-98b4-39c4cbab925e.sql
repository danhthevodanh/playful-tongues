
-- Profiles table (parents and children)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_parent BOOLEAN NOT NULL DEFAULT false,
  native_language TEXT DEFAULT 'en',
  avatar_url TEXT,
  parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pet state table
CREATE TABLE public.pets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Blob',
  words_spoken INTEGER NOT NULL DEFAULT 0,
  evolution_stage INTEGER NOT NULL DEFAULT 0,
  favorite_words TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Game progress table
CREATE TABLE public.game_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_mode TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  best_time_ms INTEGER,
  words_used TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_progress ENABLE ROW LEVEL SECURITY;

-- Helper function: check if current user owns a profile
CREATE OR REPLACE FUNCTION public.is_own_profile(p_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_id AND auth_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Helper function: check if current user is parent of a profile
CREATE OR REPLACE FUNCTION public.is_parent_of(p_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_id
      AND parent_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Profiles policies
CREATE POLICY "Users can view own and children profiles"
  ON public.profiles FOR SELECT
  USING (is_own_profile(id) OR is_parent_of(id));

CREATE POLICY "Parents can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth_id = auth.uid() AND is_parent = true);

CREATE POLICY "Parents can insert child profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (is_parent = false AND parent_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update own and children profiles"
  ON public.profiles FOR UPDATE
  USING (is_own_profile(id) OR is_parent_of(id));

CREATE POLICY "Parents can delete child profiles"
  ON public.profiles FOR DELETE
  USING (is_parent_of(id));

-- Pets policies
CREATE POLICY "Users can view own and children pets"
  ON public.pets FOR SELECT
  USING (is_own_profile(profile_id) OR is_parent_of(profile_id));

CREATE POLICY "Users can insert own pet"
  ON public.pets FOR INSERT
  WITH CHECK (is_own_profile(profile_id) OR is_parent_of(profile_id));

CREATE POLICY "Users can update own and children pets"
  ON public.pets FOR UPDATE
  USING (is_own_profile(profile_id) OR is_parent_of(profile_id));

-- Game progress policies
CREATE POLICY "Users can view own and children progress"
  ON public.game_progress FOR SELECT
  USING (is_own_profile(profile_id) OR is_parent_of(profile_id));

CREATE POLICY "Users can insert own progress"
  ON public.game_progress FOR INSERT
  WITH CHECK (is_own_profile(profile_id) OR is_parent_of(profile_id));

CREATE POLICY "Users can update own progress"
  ON public.game_progress FOR UPDATE
  USING (is_own_profile(profile_id) OR is_parent_of(profile_id));

-- Trigger for auto-creating parent profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (auth_id, name, is_parent)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Parent'), true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON public.pets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_game_progress_updated_at BEFORE UPDATE ON public.game_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
