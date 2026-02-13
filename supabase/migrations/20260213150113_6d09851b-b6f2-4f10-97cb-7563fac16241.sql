CREATE POLICY "Users can delete own and children pets"
ON public.pets FOR DELETE
TO authenticated
USING (is_own_profile(profile_id) OR is_parent_of(profile_id));