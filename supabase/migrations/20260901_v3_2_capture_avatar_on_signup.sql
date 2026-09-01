-- Tijvorya v3.2: handle_new_user() never wrote profiles.avatar, so every
-- account (Google OAuth or email/password) had a permanently null avatar
-- in the database. The app's client-side auth code (src/lib/auth.ts)
-- partially papered over this for the *current session's own* avatar by
-- falling back to the live OAuth session metadata on every login, but
-- that fallback only helps code paths that call it - a direct query
-- against profiles.avatar (or the denormalized author_avatar copied onto
-- reel_comments at insert time before this fix existed) still got null.
--
-- Also picks up Google's raw "picture" metadata key as a fallback, not
-- just the "avatar_url" key Supabase usually normalises it to - mirrors
-- the same two-key fallback already used for full_name/name.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,email,full_name,phone,avatar,role)
  values(new.id,coalesce(new.email,''),coalesce(new.raw_user_meta_data->>'full_name',''),new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    case when new.raw_user_meta_data->>'role' in ('customer','merchant','influencer') then new.raw_user_meta_data->>'role' else 'customer' end)
  on conflict(id) do nothing;
  return new;
end; $$;

-- One-time backfill for accounts that already exist with a null avatar,
-- so users who signed up before this fix see their photo immediately
-- instead of only after their next sign-in.
update public.profiles p
set avatar = coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')
from auth.users u
where u.id = p.id
  and p.avatar is null
  and coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture') is not null;
