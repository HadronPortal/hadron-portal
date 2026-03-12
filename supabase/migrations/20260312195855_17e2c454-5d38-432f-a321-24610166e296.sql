
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read avatars" ON storage.objects;

-- Create permissive policies for the avatars bucket (app uses custom auth, not Supabase Auth)
CREATE POLICY "Public upload avatars"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Public read avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Public update avatars"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Public delete avatars"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'avatars');
