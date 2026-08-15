-- Tijvorya Platform v1.3.0
-- Upgrade migration: custom storefront themes + secure real-time messaging
begin;

alter table public.stores add column if not exists theme jsonb not null default jsonb_build_object(
  'preset','modern',
  'accentColor','#1769e0',
  'backgroundColor','#f5f8fc',
  'surfaceColor','#ffffff',
  'textColor','#101828',
  'heroStyle','cover',
  'layout','grid',
  'font','system',
  'buttonStyle','solid',
  'cardRadius',14,
  'announcement',''
);

alter table public.platform_settings add column if not exists messaging_enabled boolean not null default true;

create table if not exists public.conversations (
  id text primary key,
  store_id text not null references public.stores(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  customer_name text not null,
  customer_avatar text,
  subject text not null default '',
  product_id text references public.products(id) on delete set null,
  order_id text references public.orders(id) on delete set null,
  status text not null default 'open' check (status in ('open','closed')),
  unread_by_merchant integer not null default 0 check (unread_by_merchant >= 0),
  unread_by_customer integer not null default 0 check (unread_by_customer >= 0),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id text primary key,
  conversation_id text not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  sender_role text not null check (sender_role in ('customer','merchant','admin')),
  text text not null check (char_length(text) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists conversations_store_id_idx on public.conversations(store_id);
create index if not exists conversations_customer_id_idx on public.conversations(customer_id);
create index if not exists conversations_last_message_at_idx on public.conversations(last_message_at desc);
create index if not exists messages_conversation_created_idx on public.messages(conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "conversations participant read" on public.conversations;
create policy "conversations participant read" on public.conversations for select
using (customer_id = auth.uid() or public.owns_store(store_id) or public.is_admin());

drop policy if exists "conversations customer create" on public.conversations;
create policy "conversations customer create" on public.conversations for insert
with check (
  customer_id = auth.uid()
  and exists(select 1 from public.stores s where s.id = conversations.store_id and s.status = 'active')
  and (
    product_id is null
    or exists(select 1 from public.products p where p.id = conversations.product_id and p.store_id = conversations.store_id and p.status = 'active')
  )
  and (
    order_id is null
    or exists(select 1 from public.orders o where o.id = conversations.order_id and o.store_id = conversations.store_id and o.customer_id = auth.uid())
  )
);

drop policy if exists "conversations participant update" on public.conversations;
create policy "conversations participant update" on public.conversations for update
using (customer_id = auth.uid() or public.owns_store(store_id) or public.is_admin())
with check (customer_id = auth.uid() or public.owns_store(store_id) or public.is_admin());

drop policy if exists "messages participant read" on public.messages;
create policy "messages participant read" on public.messages for select
using (
  exists(
    select 1 from public.conversations c
    where c.id = messages.conversation_id
      and (c.customer_id = auth.uid() or public.owns_store(c.store_id) or public.is_admin())
  )
);

drop policy if exists "messages participant create" on public.messages;
create policy "messages participant create" on public.messages for insert
with check (
  sender_id = auth.uid()
  and exists(
    select 1 from public.conversations c
    where c.id = messages.conversation_id
      and c.status = 'open'
      and (
        (messages.sender_role = 'customer' and c.customer_id = auth.uid())
        or (messages.sender_role = 'merchant' and public.owns_store(c.store_id))
        or (messages.sender_role = 'admin' and public.is_admin())
      )
  )
);

create or replace function public.protect_conversation_update()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  -- Updates made by the trusted message synchronization trigger are allowed.
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  if new.id is distinct from old.id
    or new.store_id is distinct from old.store_id
    or new.customer_id is distinct from old.customer_id
    or new.customer_name is distinct from old.customer_name
    or new.customer_avatar is distinct from old.customer_avatar
    or new.subject is distinct from old.subject
    or new.product_id is distinct from old.product_id
    or new.order_id is distinct from old.order_id
    or new.created_at is distinct from old.created_at then
    raise exception 'Conversation identity and context are immutable';
  end if;

  if public.is_admin() then
    return new;
  end if;

  if public.owns_store(old.store_id) then
    if new.unread_by_customer is distinct from old.unread_by_customer
      or new.last_message_at is distinct from old.last_message_at
      or new.unread_by_merchant > old.unread_by_merchant then
      raise exception 'Merchant may only clear merchant unread messages or change status';
    end if;
    return new;
  end if;

  if old.customer_id = auth.uid() then
    if new.status is distinct from old.status
      or new.unread_by_merchant is distinct from old.unread_by_merchant
      or new.last_message_at is distinct from old.last_message_at
      or new.unread_by_customer > old.unread_by_customer then
      raise exception 'Customer may only clear customer unread messages';
    end if;
    return new;
  end if;

  raise exception 'Conversation update is not allowed';
end;
$$;

drop trigger if exists protect_conversation_update_trigger on public.conversations;
create trigger protect_conversation_update_trigger
before update on public.conversations
for each row execute function public.protect_conversation_update();

create or replace function public.sync_conversation_after_message()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  update public.conversations
  set last_message_at = new.created_at,
      unread_by_merchant = unread_by_merchant + case when new.sender_role in ('customer','admin') then 1 else 0 end,
      unread_by_customer = unread_by_customer + case when new.sender_role in ('merchant','admin') then 1 else 0 end
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists sync_conversation_after_message_trigger on public.messages;
create trigger sync_conversation_after_message_trigger
after insert on public.messages
for each row execute function public.sync_conversation_after_message();

do $$
begin
  alter publication supabase_realtime add table public.conversations;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;

commit;
