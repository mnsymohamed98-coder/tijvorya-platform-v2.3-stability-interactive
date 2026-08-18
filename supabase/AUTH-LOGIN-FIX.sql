-- Tijvorya authentication/profile compatibility fix
-- Run once in Supabase SQL Editor on the production project.
begin;

alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists avatar text;
alter table public.profiles add column if not exists admin_role text;
alter table public.profiles add column if not exists status text not null default 'active';
alter table public.profiles add column if not exists created_at timestamptz not null default now();

-- Normalize the older "shopper" role used by an early profiles table.
update public.profiles set role = 'customer' where role = 'shopper';

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('customer','merchant','influencer','admin'));

alter table public.profiles drop constraint if exists profiles_admin_role_check;
alter table public.profiles add constraint profiles_admin_role_check
  check (admin_role is null or admin_role in ('super_admin','content_moderator','store_manager','customer_support','finance_manager'));

update public.profiles
set admin_role = 'super_admin'
where role = 'admin' and admin_role is null;

update public.profiles set status = 'active' where status is null;

grant select on public.profiles to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and coalesce(status, 'active') = 'active'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id,email,full_name,phone,role,status)
  values(
    new.id,
    coalesce(new.email,''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'phone',
    case
      when new.raw_user_meta_data->>'role' in ('customer','merchant','influencer') then new.raw_user_meta_data->>'role'
      else 'customer'
    end,
    'active'
  )
  on conflict(id) do update set
    email = excluded.email,
    full_name = case when public.profiles.full_name = '' then excluded.full_name else public.profiles.full_name end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

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
  if target_role not in ('customer','merchant') then raise exception 'Unsupported onboarding role'; end if;

  select role into current_role from public.profiles where id = auth.uid() for update;
  if current_role = 'admin' then return current_role; end if;

  if current_role is null then
    insert into public.profiles(id,email,full_name,role,status)
    select id,coalesce(email,''),coalesce(raw_user_meta_data->>'full_name',raw_user_meta_data->>'name',''),target_role,'active'
    from auth.users where id=auth.uid();
  else
    update public.profiles set role=target_role where id=auth.uid();
  end if;

  update auth.users
  set raw_user_meta_data=jsonb_set(coalesce(raw_user_meta_data,'{}'::jsonb),'{role}',to_jsonb(target_role),true)
  where id=auth.uid();
  return target_role;
end;
$$;

grant execute on function public.complete_onboarding_role(text) to authenticated;

alter table public.profiles enable row level security;
drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

commit;
