-- ============================================================================
-- FIX: Update handle_new_user() to also set avatar_url from auth metadata
-- or generate a default DiceBear avatar URL.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  _display_name text;
  _avatar_url text;
begin
  _display_name := coalesce(
    new.raw_user_meta_data ->> 'display_name',
    split_part(new.email, '@', 1)
  );

  _avatar_url := coalesce(
    new.raw_user_meta_data ->> 'avatar_url',
    'https://api.dicebear.com/7.x/identicon/svg?seed=' || new.id::text
  );

  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    _display_name,
    _avatar_url
  );
  return new;
end;
$$;
