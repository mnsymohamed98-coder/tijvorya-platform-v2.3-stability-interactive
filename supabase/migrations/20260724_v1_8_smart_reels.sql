-- Tijvorya v1.8: smart reels strategy, recommendations and analytics foundation
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
create policy "reel events insert" on public.reel_events for insert with check (auth.uid() = user_id or user_id is null);
create policy "reel events owner read" on public.reel_events for select using (
  exists(select 1 from public.reels r join public.stores s on s.id=r.store_id where r.id=reel_id and s.owner_id=auth.uid()) or public.is_admin()
);
