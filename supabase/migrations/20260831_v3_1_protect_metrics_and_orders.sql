-- Tijvorya v3.1: close the "column immutability" gap flagged by the
-- pre-launch security audit (findings M1/M1b/M2).
--
-- RLS policies on stores/products/reels/orders correctly restrict WHICH
-- ROWS a merchant can write, but every UPDATE/upsert on those tables is a
-- full-row write from the client, and the policies don't restrict WHICH
-- COLUMNS change. Concretely, before this migration a merchant could:
--   - set stores.rating / products.rating / products.featured to anything,
--   - set reels.views/likes/shares/saves/product_clicks/orders_attributed
--     to anything, and reset reviewed_at/reviewed_by/rejection_reason
--     (the moderation audit trail) just by editing a reel - the client
--     always echoes back whatever was in its stale local state, so this
--     already happened by accident on every reel edit (M1b),
--   - rewrite orders.total/subtotal/delivery_fee/customer_name/phone/
--     address on any of their own orders via the same update path the app
--     uses for order-status changes - direct commission-evasion surface.
--
-- Fix: for stores/products/reels, silently coerce the protected columns
-- back to their real (existing-row) value for non-admin writes, the same
-- pattern protect_store_write() already uses for verified/status - NOT a
-- raised exception, because the client legitimately echoes stale values
-- for these on every ordinary save and an exception here would repeat the
-- exact "can't save my own store settings" bug fixed in v3.0.
--
-- For orders, the app's own write path (changeOrderStatus) only ever
-- sends `{status}` as a partial UPDATE, so every other column already
-- equals OLD on any legitimate call - a RAISE here can never fire from
-- normal app usage, and turns a crafted direct-API tampering attempt into
-- a loud, auditable failure instead of a silent commission-evasion write.

create or replace function public.protect_store_write()
returns trigger language plpgsql security definer set search_path=public as $$
declare
  v_existing record;
begin
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    select verified, status, rating into v_existing from public.stores where id = new.id;
    if found then
      if new.verified is distinct from v_existing.verified then
        raise exception 'Only an administrator can change store verification';
      end if;
      if v_existing.status = 'suspended' and new.status is distinct from v_existing.status then
        raise exception 'Only an administrator can lift a store suspension';
      end if;
      if new.status = 'suspended' and v_existing.status is distinct from new.status then
        raise exception 'Only an administrator can suspend a store';
      end if;
      new.rating := v_existing.rating;
      return new;
    end if;
    if new.verified then
      raise exception 'Only an administrator can verify a store';
    end if;
    if new.status = 'suspended' then
      raise exception 'Only an administrator can suspend a store';
    end if;
    new.rating := 0;
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
  new.rating := old.rating;

  return new;
end;
$$;

create or replace function public.protect_reel_write()
returns trigger language plpgsql security definer set search_path=public as $$
declare
  v_moderation_required boolean;
  v_allowed_owner_statuses text[];
  v_existing record;
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

  if tg_op = 'INSERT' then
    select views, likes, shares, saves, product_clicks, orders_attributed,
           reviewed_at, reviewed_by, rejection_reason, comments_count
      into v_existing from public.reels where id = new.id;
    if found then
      new.views := v_existing.views;
      new.likes := v_existing.likes;
      new.shares := v_existing.shares;
      new.saves := v_existing.saves;
      new.product_clicks := v_existing.product_clicks;
      new.orders_attributed := v_existing.orders_attributed;
      new.reviewed_at := v_existing.reviewed_at;
      new.reviewed_by := v_existing.reviewed_by;
      new.rejection_reason := v_existing.rejection_reason;
      new.comments_count := v_existing.comments_count;
    else
      new.views := 0;
      new.likes := 0;
      new.shares := 0;
      new.saves := 0;
      new.product_clicks := 0;
      new.orders_attributed := 0;
      new.comments_count := 0;
    end if;
    return new;
  end if;

  new.views := old.views;
  new.likes := old.likes;
  new.shares := old.shares;
  new.saves := old.saves;
  new.product_clicks := old.product_clicks;
  new.orders_attributed := old.orders_attributed;
  new.reviewed_at := old.reviewed_at;
  new.reviewed_by := old.reviewed_by;
  new.rejection_reason := old.rejection_reason;
  new.comments_count := old.comments_count;

  return new;
end;
$$;

create or replace function public.protect_product_write()
returns trigger language plpgsql security definer set search_path=public as $$
declare
  v_existing record;
begin
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    select rating, featured into v_existing from public.products where id = new.id;
    if found then
      new.rating := v_existing.rating;
      new.featured := v_existing.featured;
    else
      new.rating := 0;
      new.featured := false;
    end if;
    return new;
  end if;

  new.rating := old.rating;
  new.featured := old.featured;

  return new;
end;
$$;

drop trigger if exists protect_product_write_trigger on public.products;
create trigger protect_product_write_trigger
before insert or update on public.products
for each row execute function public.protect_product_write();

create or replace function public.protect_order_write()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  if new.store_id is distinct from old.store_id
    or new.customer_id is distinct from old.customer_id
    or new.customer_name is distinct from old.customer_name
    or new.phone is distinct from old.phone
    or new.address is distinct from old.address
    or new.notes is distinct from old.notes
    or new.subtotal is distinct from old.subtotal
    or new.delivery_fee is distinct from old.delivery_fee
    or new.total is distinct from old.total
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Only an order''s status may be changed';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_order_write_trigger on public.orders;
create trigger protect_order_write_trigger
before update on public.orders
for each row execute function public.protect_order_write();
