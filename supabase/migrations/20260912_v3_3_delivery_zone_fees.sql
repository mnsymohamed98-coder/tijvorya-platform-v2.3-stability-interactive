-- Tijvorya v3.3: replace the single flat store.delivery_fee with a
-- per-zone price map (gaza/central/khanYounis). The customer now picks
-- their delivery area at checkout and the fee is looked up server-side
-- from the store's configured price for that specific zone, instead of
-- one flat number applied to every address.
--
-- The old delivery_fee column on stores stays in place (unused) rather
-- than being dropped - existing stores get their old flat fee copied
-- into all three zones as a starting point so nobody's delivery pricing
-- silently resets to free.

alter table public.stores add column if not exists delivery_fees jsonb not null default '{}'::jsonb;
update public.stores set delivery_fees = jsonb_build_object('gaza', delivery_fee, 'central', delivery_fee, 'khanYounis', delivery_fee)
  where delivery_fees = '{}'::jsonb and delivery_fee is not null;

alter table public.orders add column if not exists delivery_zone text;
do $$ begin
  alter table public.orders add constraint orders_delivery_zone_check check (delivery_zone is null or delivery_zone in ('gaza','central','khanYounis'));
exception when duplicate_object then null; end $$;

-- create_checkout_order gains p_delivery_zone as a new final parameter
-- with a default, which Postgres allows CREATE OR REPLACE to do in place
-- (the original 7 parameters are unchanged in name/type/order) - no need
-- to drop the old function first.
create or replace function public.create_checkout_order(
  p_customer_name text,
  p_phone text,
  p_address text,
  p_notes text,
  p_items jsonb,
  p_payment_method text default null,
  p_payment_proof_url text default null,
  p_delivery_zone text default null
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
  v_payment_method text := nullif(btrim(coalesce(p_payment_method, '')), '');
  v_payment_proof_url text := nullif(btrim(coalesce(p_payment_proof_url, '')), '');
  v_delivery_zone text := nullif(btrim(coalesce(p_delivery_zone, '')), '');
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
  if v_payment_method is null or v_payment_method not in ('bank_transfer','palpay') then raise exception 'INVALID_PAYMENT_METHOD'; end if;
  if v_payment_proof_url is null or char_length(v_payment_proof_url) > 2000 then raise exception 'PAYMENT_PROOF_REQUIRED'; end if;
  if v_delivery_zone is null or v_delivery_zone not in ('gaza','central','khanYounis') then raise exception 'INVALID_DELIVERY_ZONE'; end if;
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
           s.status as store_status, s.delivery_fees
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
      v_delivery_fee := greatest(coalesce((v_product.delivery_fees ->> v_delivery_zone)::numeric, 0), 0);
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

  insert into public.orders(id, store_id, customer_id, customer_name, phone, address, notes, status, subtotal, delivery_zone, delivery_fee, total, payment_method, payment_proof_url, created_at)
  values(v_order_id, v_store_id, auth.uid(), v_customer_name, v_phone, v_address, v_notes, 'pending', v_subtotal, v_delivery_zone, v_delivery_fee, v_total, v_payment_method, v_payment_proof_url, v_created_at);

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
    'delivery_zone', v_delivery_zone,
    'delivery_fee', v_delivery_fee,
    'total', v_total,
    'payment_method', v_payment_method,
    'payment_proof_url', v_payment_proof_url,
    'order_items', v_result_items,
    'created_at', v_created_at
  );
end;
$$;

revoke all on function public.create_checkout_order(text,text,text,text,jsonb,text,text,text) from public;
grant execute on function public.create_checkout_order(text,text,text,text,jsonb,text,text,text) to anon, authenticated;
