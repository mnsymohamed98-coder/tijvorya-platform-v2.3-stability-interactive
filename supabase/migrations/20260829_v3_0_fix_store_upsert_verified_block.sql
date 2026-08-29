-- Tijvorya v3.0: fix protect_store_write() blocking every settings save
-- for an already-verified merchant.
--
-- Postgres fires a table's BEFORE INSERT trigger for every
-- INSERT ... ON CONFLICT DO UPDATE attempt (i.e. every upsertStore() call,
-- the only way this app ever writes to stores) BEFORE it checks whether a
-- conflict exists - tg_op reads 'INSERT' even when the statement will go
-- on to update an existing row. The original INSERT branch assumed
-- tg_op='INSERT' meant a genuinely new row and unconditionally rejected
-- new.verified/new.status='suspended' - which broke every settings save
-- for an already-verified merchant, since their own real edits always
-- resend the store's current (already-true) verified value. Confirmed
-- live: a merchant editing ordinary store fields (name, address, delivery
-- fee, etc.) on an already-verified store got "Only an administrator can
-- verify a store" (P0001) on every save.
--
-- Fixed by looking up whether a row with this id already exists and, if
-- so, applying the same "only block actual changes" logic the UPDATE
-- branch already had - regardless of what tg_op claims.
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
    select verified, status into v_existing from public.stores where id = new.id;
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
      return new;
    end if;
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
