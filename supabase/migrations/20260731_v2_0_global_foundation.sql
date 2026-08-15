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
