-- Tijvorya v2.7: real view/like/comment tracking foundation for reels.
--
-- Views: reuse reel_events (already exists from v1.8), no new table. A
-- partial unique index per (reel, session) and per (reel, user) makes a
-- repeat view from the same session or the same logged-in user a
-- DB-enforced no-op - the app can insert freely and ignore a 23505
-- unique-violation instead of having to check-then-insert.
create unique index if not exists reel_events_view_dedup_session_uidx
  on public.reel_events(reel_id, session_id) where event_type = 'view' and session_id is not null;
create unique index if not exists reel_events_view_dedup_user_uidx
  on public.reel_events(reel_id, user_id) where event_type = 'view' and user_id is not null;

create or replace function public.sync_reel_view_count()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.event_type = 'view' then
    update public.reels set views = views + 1 where id = new.reel_id;
  end if;
  return new;
end;
$$;
drop trigger if exists sync_reel_view_count_trigger on public.reel_events;
create trigger sync_reel_view_count_trigger
after insert on public.reel_events
for each row execute function public.sync_reel_view_count();

-- Likes: a dedicated join table, not reel_events - reel_events is an
-- append-only signal log with no 'unlike' counterpart, unreliable to derive
-- a toggle button's current on/off state from and easy to spam. The
-- (reel_id, user_id) primary key makes "like" exactly-once per user;
-- toggling in the UI is insert-to-like, delete-to-unlike.
create table if not exists public.reel_likes (
  reel_id text not null references public.reels(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (reel_id, user_id)
);
alter table public.reel_likes enable row level security;
drop policy if exists "reel likes read" on public.reel_likes;
create policy "reel likes read" on public.reel_likes for select
  using (auth.uid() = user_id or exists(select 1 from public.reels r where r.id=reel_id and (r.status='approved' or public.owns_store(r.store_id))) or public.is_admin());
drop policy if exists "reel likes insert own" on public.reel_likes;
create policy "reel likes insert own" on public.reel_likes for insert with check (auth.uid() = user_id);
drop policy if exists "reel likes delete own" on public.reel_likes;
create policy "reel likes delete own" on public.reel_likes for delete using (auth.uid() = user_id);

create or replace function public.sync_reel_like_count()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_op = 'INSERT' then
    update public.reels set likes = likes + 1 where id = new.reel_id;
    return new;
  else
    update public.reels set likes = greatest(0, likes - 1) where id = old.reel_id;
    return old;
  end if;
end;
$$;
drop trigger if exists sync_reel_like_count_insert on public.reel_likes;
create trigger sync_reel_like_count_insert after insert on public.reel_likes
for each row execute function public.sync_reel_like_count();
drop trigger if exists sync_reel_like_count_delete on public.reel_likes;
create trigger sync_reel_like_count_delete after delete on public.reel_likes
for each row execute function public.sync_reel_like_count();

-- Comments: a new table modeled on messages (same participant-scoped RLS
-- shape), not reel_events - comments must be publicly readable on approved
-- reels, but reel_events' select policy is intentionally owner/admin-only
-- for analytics privacy. author_name/author_avatar are denormalized onto
-- the row at insert time, same as conversations.customer_name/
-- customer_avatar, avoiding a profiles join on every comment list load.
-- No update/delete policy at all - v1 has no moderation tooling by design,
-- a deliberate fast-follow boundary, not an oversight.
create table if not exists public.reel_comments (
  id text primary key,
  reel_id text not null references public.reels(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  author_avatar text,
  text text not null check (char_length(text) between 1 and 280),
  created_at timestamptz not null default now()
);
create index if not exists reel_comments_reel_created_idx on public.reel_comments(reel_id, created_at);
alter table public.reel_comments enable row level security;
drop policy if exists "reel comments read" on public.reel_comments;
create policy "reel comments read" on public.reel_comments for select
  using (exists(select 1 from public.reels r where r.id=reel_id and (r.status='approved' or public.owns_store(r.store_id))) or public.is_admin());
drop policy if exists "reel comments insert own" on public.reel_comments;
create policy "reel comments insert own" on public.reel_comments for insert
  with check (user_id = auth.uid() and exists(select 1 from public.reels r where r.id=reel_id and r.status='approved'));

alter table public.reels add column if not exists comments_count bigint not null default 0;
create or replace function public.sync_reel_comment_count()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  update public.reels set comments_count = comments_count + 1 where id = new.reel_id;
  return new;
end;
$$;
drop trigger if exists sync_reel_comment_count_trigger on public.reel_comments;
create trigger sync_reel_comment_count_trigger
after insert on public.reel_comments
for each row execute function public.sync_reel_comment_count();
