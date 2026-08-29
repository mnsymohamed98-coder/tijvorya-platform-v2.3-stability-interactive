-- Tijvorya v2.6: let merchants edit an already-approved reel.
--
-- reels.hashtags/best_post_time/ai_score/ai_suggestions/watch_time_seconds/
-- shares/saves/product_clicks/orders_attributed and the reel_events table
-- were added in migrations/20260724_v1_8_smart_reels.sql - repeated here
-- with "if not exists" guards so this migration is safe to run whether or
-- not that one already landed on this database.
alter table public.reels add column if not exists hashtags text[] not null default '{}';
alter table public.reels add column if not exists best_post_time text;
alter table public.reels add column if not exists ai_score integer check (ai_score between 0 and 100);
alter table public.reels add column if not exists ai_suggestions text[] not null default '{}';
alter table public.reels add column if not exists watch_time_seconds numeric not null default 0;
alter table public.reels add column if not exists shares bigint not null default 0;
alter table public.reels add column if not exists saves bigint not null default 0;
alter table public.reels add column if not exists product_clicks bigint not null default 0;
alter table public.reels add column if not exists orders_attributed bigint not null default 0;

create table if not exists public.reel_events (
  id bigint generated always as identity primary key,
  reel_id text not null references public.reels(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  session_id text,
  event_type text not null check (event_type in ('impression','view','complete','like','save','share','product_click','add_to_cart','order')),
  watch_seconds numeric not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists reel_events_reel_created_idx on public.reel_events(reel_id, created_at desc);
create index if not exists reel_events_user_created_idx on public.reel_events(user_id, created_at desc);
alter table public.reel_events enable row level security;
drop policy if exists "reel events insert" on public.reel_events;
create policy "reel events insert" on public.reel_events for insert with check (auth.uid() = user_id or user_id is null);
drop policy if exists "reel events owner read" on public.reel_events;
create policy "reel events owner read" on public.reel_events for select using (
  exists(select 1 from public.reels r join public.stores s on s.id=r.store_id where r.id=reel_id and s.owner_id=auth.uid()) or public.is_admin()
);

-- The actual v2.6 change: a merchant editing a *published* (approved) reel
-- re-runs the same submit-for-review path as a new reel (see saveReel in
-- app-provider.tsx), which needs to UPDATE a row that is currently
-- 'approved' - the old policy's USING clause only matched 'draft'/
-- 'rejected', so that update silently affected 0 rows. protect_reel_write()
-- needs no change: it already allows a non-admin owner's new.status to land
-- on 'pending' (always) or 'approved' (only when reel_moderation_required is
-- off), which is exactly what the edit-resubmit flow produces.
drop policy if exists "reels owner draft update" on public.reels;
drop policy if exists "reels owner update" on public.reels;
create policy "reels owner update" on public.reels for update
  using (public.owns_store(store_id) and status in ('draft','rejected','approved'))
  with check (public.owns_store(store_id));
