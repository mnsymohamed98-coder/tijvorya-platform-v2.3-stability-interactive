-- Tijvorya production schema (Supabase/PostgreSQL)
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  full_name text not null default '',
  phone text,
  avatar text,
  role text not null default 'customer' check (role in ('customer','merchant','influencer','admin')),
  admin_role text check (admin_role in ('super_admin','content_moderator','store_manager','customer_support','finance_manager')),
  status text not null default 'active' check (status in ('active','suspended')),
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists admin_role text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists avatar text;
alter table public.profiles add column if not exists status text not null default 'active';
alter table public.profiles add column if not exists created_at timestamptz not null default now();
do $$ begin
  alter table public.profiles add constraint profiles_admin_role_check check (admin_role is null or admin_role in ('super_admin','content_moderator','store_manager','customer_support','finance_manager'));
exception when duplicate_object then null; end $$;

create table if not exists public.stores (
  id text primary key,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  slug text unique not null,
  name text not null,
  name_en text,
  description text default '',
  description_en text default '',
  logo_url text default '/assets/logo.svg',
  cover_url text default '/assets/cover-urban.svg',
  rating numeric(3,2) default 0,
  verified boolean not null default false,
  city text default '',
  completion integer not null default 0,
  status text not null default 'draft' check (status in ('draft','active','suspended')),
  phone text,
  whatsapp text,
  delivery_fee numeric(12,2) default 0,
  theme_color text default '#1769e0',
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  store_id text not null references public.stores(id) on delete cascade,
  name text not null,
  name_en text,
  description text default '',
  description_en text default '',
  price numeric(12,2) not null default 0,
  compare_at_price numeric(12,2),
  stock integer not null default 0,
  category text default '',
  image_url text,
  images jsonb not null default '[]'::jsonb,
  variants jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('active','draft','archived')),
  rating numeric(3,2) default 0,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.reels (
  id text primary key,
  store_id text not null references public.stores(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  caption text not null default '',
  caption_en text default '',
  video_url text not null,
  cover_url text,
  status text not null default 'pending' check (status in ('draft','pending','approved','rejected')),
  views bigint not null default 0,
  likes bigint not null default 0,
  rejection_reason text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  store_id text not null references public.stores(id),
  customer_id uuid references public.profiles(id),
  customer_name text not null,
  phone text not null,
  address text not null,
  notes text,
  status text not null default 'pending' check (status in ('pending','accepted','preparing','ready','out_for_delivery','completed','cancelled')),
  subtotal numeric(12,2) not null default 0,
  delivery_fee numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id text not null references public.orders(id) on delete cascade,
  product_id text references public.products(id),
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null,
  variant text
);

create table if not exists public.platform_settings (
  id text primary key default 'main',
  platform_name text not null default 'Tijvorya',
  support_email text not null default 'support@tijvorya.com',
  maintenance_mode boolean not null default false,
  merchant_registration_enabled boolean not null default true,
  reel_moderation_required boolean not null default true,
  max_reel_size_mb integer not null default 20,
  commission_percent numeric(5,2) not null default 5,
  ai_enabled boolean not null default true,
  ai_product_writer_enabled boolean not null default true,
  ai_reel_writer_enabled boolean not null default true,
  ai_moderation_enabled boolean not null default true,
  ai_daily_request_limit integer not null default 50,
  updated_at timestamptz not null default now()
);
insert into public.platform_settings(id) values ('main') on conflict (id) do nothing;
alter table public.platform_settings add column if not exists ai_enabled boolean not null default true;
alter table public.platform_settings add column if not exists ai_product_writer_enabled boolean not null default true;
alter table public.platform_settings add column if not exists ai_reel_writer_enabled boolean not null default true;
alter table public.platform_settings add column if not exists ai_moderation_enabled boolean not null default true;
alter table public.platform_settings add column if not exists ai_daily_request_limit integer not null default 50;


create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'active');
$$;

create or replace function public.owns_store(target_store_id text)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.stores where id = target_store_id and owner_id = auth.uid());
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,email,full_name,phone,role)
  values(new.id,coalesce(new.email,''),coalesce(new.raw_user_meta_data->>'full_name',''),new.raw_user_meta_data->>'phone',
    case when new.raw_user_meta_data->>'role' in ('customer','merchant','influencer') then new.raw_user_meta_data->>'role' else 'customer' end)
  on conflict(id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.products enable row level security;
alter table public.reels enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.platform_settings enable row level security;

drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles for select using (id=auth.uid() or public.is_admin());
create policy "profiles admin update" on public.profiles for update using (public.is_admin()) with check (public.is_admin());
create policy "stores public active" on public.stores for select using (status='active' or owner_id=auth.uid() or public.is_admin());
create policy "stores owner write" on public.stores for all using (owner_id=auth.uid() or public.is_admin()) with check (owner_id=auth.uid() or public.is_admin());
create policy "products public active" on public.products for select using (status='active' or public.owns_store(store_id) or public.is_admin());
create policy "products owner write" on public.products for all using (public.owns_store(store_id) or public.is_admin()) with check (public.owns_store(store_id) or public.is_admin());
create policy "reels public approved" on public.reels for select using (status='approved' or public.owns_store(store_id) or public.is_admin());
create policy "reels owner insert" on public.reels for insert with check (public.owns_store(store_id));
create policy "reels owner draft update" on public.reels for update using (public.owns_store(store_id) and status in ('draft','rejected')) with check (public.owns_store(store_id));
create policy "reels admin moderate" on public.reels for update using (public.is_admin()) with check (public.is_admin());
create policy "orders customer or merchant read" on public.orders for select using (customer_id=auth.uid() or public.owns_store(store_id) or public.is_admin());
create policy "orders create" on public.orders for insert with check (auth.uid() is not null or customer_id is null);
create policy "orders merchant update" on public.orders for update using (public.owns_store(store_id) or public.is_admin()) with check (public.owns_store(store_id) or public.is_admin());
create policy "order items visible" on public.order_items for select using (exists(select 1 from public.orders o where o.id=order_id and (o.customer_id=auth.uid() or public.owns_store(o.store_id) or public.is_admin())));
create policy "order items create" on public.order_items for insert with check (exists(select 1 from public.orders o where o.id=order_id));
create policy "settings public read" on public.platform_settings for select using (true);
create policy "settings admin write" on public.platform_settings for all using (public.is_admin()) with check (public.is_admin());


-- v1.3 Store themes and messaging
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
    where c.id = conversation_id
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

-- v1.6 Google OAuth onboarding role completion.
create or replace function public.complete_onboarding_role(target_role text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_role text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if target_role not in ('customer', 'merchant') then raise exception 'Unsupported onboarding role'; end if;
  select role into current_role from public.profiles where id = auth.uid() for update;
  if current_role = 'admin' then return current_role; end if;
  if current_role is null then
    insert into public.profiles(id,email,full_name,role,status)
    select id,coalesce(email,''),coalesce(raw_user_meta_data->>'full_name',raw_user_meta_data->>'name',''),target_role,'active'
    from auth.users where id=auth.uid();
  elsif current_role in ('customer','merchant') then
    update public.profiles set role=target_role where id=auth.uid();
  else
    raise exception 'Existing role cannot be changed during onboarding';
  end if;
  update auth.users set raw_user_meta_data=jsonb_set(coalesce(raw_user_meta_data,'{}'::jsonb),'{role}',to_jsonb(target_role),true) where id=auth.uid();
  return target_role;
end;
$$;
revoke all on function public.complete_onboarding_role(text) from public;
revoke all on function public.complete_onboarding_role(text) from anon;
grant execute on function public.complete_onboarding_role(text) to authenticated;

-- v2.0 global foundation. Kept inline so fresh installations match the latest migrations.
-- Tijvorya v2.0: secure checkout, protected contact intake and scale-oriented indexes
begin;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and admin_role is not null and status = 'active'
  );
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and admin_role = 'super_admin' and status = 'active'
  );
$$;
revoke all on function public.is_super_admin() from public;

-- Browser clients may only edit harmless fields on their own profile. Sensitive identity and
-- authorization changes go through a policy-aware SECURITY DEFINER function.
drop policy if exists "profiles admin update" on public.profiles;
drop policy if exists "profiles self basic update" on public.profiles;
create policy "profiles self basic update" on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from anon, authenticated;
grant update(full_name, phone, avatar) on public.profiles to authenticated;

create or replace function public.admin_update_profile(
  p_target_id uuid,
  p_status text,
  p_role text,
  p_admin_role text
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor public.profiles%rowtype;
  v_target public.profiles%rowtype;
  v_status text;
  v_role text;
  v_admin_role text;
begin
  if auth.uid() is null then raise exception 'UNAUTHORIZED'; end if;
  select * into v_actor from public.profiles where id = auth.uid();
  if not found or v_actor.role <> 'admin' or v_actor.admin_role is null or v_actor.status <> 'active' then raise exception 'FORBIDDEN'; end if;

  select * into v_target from public.profiles where id = p_target_id for update;
  if not found then raise exception 'USER_NOT_FOUND'; end if;

  v_status := coalesce(p_status, v_target.status);
  v_role := coalesce(p_role, v_target.role);
  v_admin_role := coalesce(p_admin_role, v_target.admin_role);

  if v_status not in ('active','suspended') then raise exception 'INVALID_STATUS'; end if;

  if v_target.role = 'admin' then
    if v_actor.admin_role <> 'super_admin' then raise exception 'FORBIDDEN'; end if;
    if p_target_id = auth.uid() then raise exception 'CANNOT_CHANGE_SELF_ADMIN_ACCESS'; end if;
    if p_role is not null and p_role <> 'admin' then raise exception 'INVALID_ROLE'; end if;
    if p_admin_role is not null and p_admin_role not in ('super_admin','content_moderator','store_manager','customer_support','finance_manager') then raise exception 'INVALID_ADMIN_ROLE'; end if;
  else
    if p_admin_role is not null then raise exception 'INVALID_ADMIN_ROLE'; end if;
    if p_role is not null then
      if v_actor.admin_role <> 'super_admin' then raise exception 'FORBIDDEN'; end if;
      if p_role not in ('customer','merchant','influencer') then raise exception 'INVALID_ROLE'; end if;
    end if;
    if p_status is not null and v_actor.admin_role not in ('super_admin','customer_support') then raise exception 'FORBIDDEN'; end if;
  end if;

  update public.profiles
  set status = v_status,
      role = v_role,
      admin_role = case when v_role = 'admin' then v_admin_role else null end
  where id = p_target_id
  returning * into v_target;

  return jsonb_build_object(
    'id', v_target.id,
    'email', v_target.email,
    'full_name', v_target.full_name,
    'phone', v_target.phone,
    'avatar', v_target.avatar,
    'role', v_target.role,
    'admin_role', v_target.admin_role,
    'status', v_target.status,
    'created_at', v_target.created_at
  );
end;
$$;
revoke all on function public.admin_update_profile(uuid,text,text,text) from public;
grant execute on function public.admin_update_profile(uuid,text,text,text) to authenticated;

create index if not exists products_public_catalog_idx on public.products(status, store_id, category);
create index if not exists products_store_created_idx on public.products(store_id, created_at desc);
create index if not exists reels_public_feed_idx on public.reels(status, created_at desc);
create index if not exists orders_store_created_idx on public.orders(store_id, created_at desc);
create index if not exists orders_customer_created_idx on public.orders(customer_id, created_at desc);

-- Checkout writes are restricted to this transaction. It locks products, verifies availability,
-- validates variants, recalculates totals from database prices and decrements stock atomically.
drop policy if exists "orders create" on public.orders;
drop policy if exists "orders create via checkout" on public.orders;
create policy "orders create via checkout" on public.orders for insert with check (false);

drop policy if exists "order items create" on public.order_items;
drop policy if exists "order items create via checkout" on public.order_items;
create policy "order items create via checkout" on public.order_items for insert with check (false);

revoke insert on public.orders from anon, authenticated;
revoke insert on public.order_items from anon, authenticated;

create or replace function public.create_checkout_order(
  p_customer_name text,
  p_phone text,
  p_address text,
  p_notes text,
  p_items jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_customer_name text := btrim(coalesce(p_customer_name, ''));
  v_phone text := btrim(coalesce(p_phone, ''));
  v_address text := btrim(coalesce(p_address, ''));
  v_notes text := nullif(btrim(coalesce(p_notes, '')), '');
  v_item jsonb;
  v_product record;
  v_product_id text;
  v_variant text;
  v_quantity integer;
  v_store_id text;
  v_delivery_fee numeric(12,2) := 0;
  v_subtotal numeric(12,2) := 0;
  v_total numeric(12,2) := 0;
  v_order_id text;
  v_created_at timestamptz := now();
  v_result_items jsonb := '[]'::jsonb;
begin
  if char_length(v_customer_name) not between 2 and 120 then raise exception 'INVALID_CUSTOMER_NAME'; end if;
  if char_length(v_phone) not between 7 and 30 then raise exception 'INVALID_PHONE'; end if;
  if char_length(v_address) not between 8 and 500 then raise exception 'INVALID_ADDRESS'; end if;
  if v_notes is not null and char_length(v_notes) > 1000 then raise exception 'NOTES_TOO_LONG'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then raise exception 'INVALID_CART'; end if;
  if jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 50 then raise exception 'INVALID_CART'; end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    if jsonb_typeof(v_item) <> 'object' then raise exception 'INVALID_CART_ITEM'; end if;
    v_product_id := nullif(btrim(v_item->>'productId'), '');
    if v_product_id is null then raise exception 'INVALID_PRODUCT'; end if;

    begin
      v_quantity := (v_item->>'quantity')::integer;
    exception when others then
      raise exception 'INVALID_QUANTITY';
    end;
    if v_quantity < 1 or v_quantity > 99 then raise exception 'INVALID_QUANTITY'; end if;

    v_variant := nullif(btrim(coalesce(v_item->>'variant', '')), '');
    if v_variant is not null and char_length(v_variant) > 120 then raise exception 'INVALID_VARIANT'; end if;

    select p.id, p.store_id, p.name, p.price, p.stock, p.status, p.variants,
           s.status as store_status, s.delivery_fee
      into v_product
      from public.products p
      join public.stores s on s.id = p.store_id
      where p.id = v_product_id
      for update of p;

    if not found or v_product.status <> 'active' or v_product.store_status <> 'active' then raise exception 'PRODUCT_UNAVAILABLE'; end if;
    if v_product.price < 0 then raise exception 'INVALID_PRODUCT_PRICE'; end if;
    if v_product.stock < v_quantity then raise exception 'INSUFFICIENT_STOCK'; end if;

    if jsonb_typeof(v_product.variants) = 'array' and jsonb_array_length(v_product.variants) > 0 then
      if v_variant is null or not exists (
        select 1 from jsonb_array_elements_text(v_product.variants) as allowed(value)
        where allowed.value = v_variant
      ) then
        raise exception 'INVALID_VARIANT';
      end if;
    else
      v_variant := null;
    end if;

    if v_store_id is null then
      v_store_id := v_product.store_id;
      v_delivery_fee := greatest(coalesce(v_product.delivery_fee, 0), 0);
    elsif v_store_id <> v_product.store_id then
      raise exception 'MULTI_STORE_CART';
    end if;

    update public.products set stock = stock - v_quantity where id = v_product.id;
    v_subtotal := v_subtotal + (v_product.price * v_quantity);
    v_result_items := v_result_items || jsonb_build_array(jsonb_build_object(
      'product_id', v_product.id,
      'product_name', v_product.name,
      'quantity', v_quantity,
      'unit_price', v_product.price,
      'variant', v_variant
    ));
  end loop;

  v_total := v_subtotal + v_delivery_fee;
  v_order_id := 'TJV-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));

  insert into public.orders(id, store_id, customer_id, customer_name, phone, address, notes, status, subtotal, delivery_fee, total, created_at)
  values(v_order_id, v_store_id, auth.uid(), v_customer_name, v_phone, v_address, v_notes, 'pending', v_subtotal, v_delivery_fee, v_total, v_created_at);

  insert into public.order_items(order_id, product_id, product_name, quantity, unit_price, variant)
  select v_order_id,
         item->>'product_id',
         item->>'product_name',
         (item->>'quantity')::integer,
         (item->>'unit_price')::numeric,
         nullif(item->>'variant', '')
  from jsonb_array_elements(v_result_items) item;

  return jsonb_build_object(
    'id', v_order_id,
    'store_id', v_store_id,
    'customer_id', auth.uid(),
    'customer_name', v_customer_name,
    'phone', v_phone,
    'address', v_address,
    'notes', v_notes,
    'status', 'pending',
    'subtotal', v_subtotal,
    'delivery_fee', v_delivery_fee,
    'total', v_total,
    'order_items', v_result_items,
    'created_at', v_created_at
  );
end;
$$;

revoke all on function public.create_checkout_order(text,text,text,text,jsonb) from public;
grant execute on function public.create_checkout_order(text,text,text,text,jsonb) to anon, authenticated;

create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) between 5 and 254),
  inquiry_type text not null check (inquiry_type in ('merchant','partnership','support','press','other')),
  message text not null check (char_length(message) between 10 and 4000),
  locale text not null default 'ar' check (locale in ('ar','en')),
  status text not null default 'new' check (status in ('new','in_progress','resolved','spam')),
  created_at timestamptz not null default now()
);
create index if not exists contact_requests_status_created_idx on public.contact_requests(status, created_at desc);
alter table public.contact_requests enable row level security;

drop policy if exists "contact requests public insert" on public.contact_requests;
drop policy if exists "contact requests admin read" on public.contact_requests;
create policy "contact requests admin read" on public.contact_requests for select using (public.is_admin());
drop policy if exists "contact requests admin update" on public.contact_requests;
create policy "contact requests admin update" on public.contact_requests for update using (public.is_admin()) with check (public.is_admin());

-- Public clients cannot bypass the server-side anti-spam controls. The contact API writes with
-- the server-only SUPABASE_SERVICE_ROLE_KEY; administrators can read/update through RLS.
revoke insert on public.contact_requests from anon, authenticated;
grant select, update on public.contact_requests to authenticated;

commit;

-- v2.1 Merchant website onboarding
alter table public.stores add column if not exists website jsonb not null default jsonb_build_object(
  'onboardingCompleted', false,
  'businessCategory', 'general',
  'tagline', '',
  'taglineEn', '',
  'about', '',
  'aboutEn', '',
  'businessEmail', '',
  'country', '',
  'address', '',
  'openingHours', '',
  'shippingAreas', '',
  'returnPolicy', '',
  'instagram', '',
  'facebook', '',
  'tiktok', ''
);

-- v2.4 Security fix: the "stores owner write" and "reels owner" policies let an owner change
-- ANY column on their own row, including trust/moderation fields that must stay admin-only
-- (stores.verified, stores.status, reels.status). These triggers close that gap without
-- touching the existing policies or any client code - admins are unaffected (short-circuited
-- at the top), and legitimate owner writes (draft -> active on first publish, draft/pending
-- reel submissions, auto-approved reels when reel_moderation_required is off) still pass.
begin;

create or replace function public.protect_store_write()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.verified then
      raise exception 'Only an administrator can verify a store';
    end if;
    if new.status = 'suspended' then
      raise exception 'Only an administrator can suspend a store';
    end if;
    return new;
  end if;

  if new.verified is distinct from old.verified then
    raise exception 'Only an administrator can change store verification';
  end if;
  if old.status = 'suspended' and new.status is distinct from old.status then
    raise exception 'Only an administrator can lift a store suspension';
  end if;
  if new.status = 'suspended' and old.status is distinct from new.status then
    raise exception 'Only an administrator can suspend a store';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_store_write_trigger on public.stores;
create trigger protect_store_write_trigger
before insert or update on public.stores
for each row execute function public.protect_store_write();

create or replace function public.protect_reel_write()
returns trigger language plpgsql security definer set search_path=public as $$
declare
  v_moderation_required boolean;
  v_allowed_owner_statuses text[];
begin
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  select coalesce(reel_moderation_required, true) into v_moderation_required
  from public.platform_settings where id = 'main';
  v_moderation_required := coalesce(v_moderation_required, true);

  v_allowed_owner_statuses := case when v_moderation_required
    then array['draft','pending']
    else array['draft','pending','approved']
  end;

  if not (new.status = any(v_allowed_owner_statuses)) then
    raise exception 'Only an administrator can approve or reject a reel';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_reel_write_trigger on public.reels;
create trigger protect_reel_write_trigger
before insert or update on public.reels
for each row execute function public.protect_reel_write();

commit;
