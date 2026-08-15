-- Tijvorya Platform v1.6.0
-- Google OAuth onboarding, role-safe profile completion and login hardening.
begin;

create or replace function public.complete_onboarding_role(target_role text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_role text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if target_role not in ('customer', 'merchant') then
    raise exception 'Unsupported onboarding role';
  end if;

  select role into current_role
  from public.profiles
  where id = auth.uid()
  for update;

  if current_role = 'admin' then
    return current_role;
  end if;

  if current_role is null then
    insert into public.profiles(id, email, full_name, role, status)
    select id, coalesce(email, ''), coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', ''), target_role, 'active'
    from auth.users where id = auth.uid();
  elsif current_role in ('customer', 'merchant') then
    update public.profiles set role = target_role where id = auth.uid();
  else
    raise exception 'Existing role cannot be changed during onboarding';
  end if;

  update auth.users
  set raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb), '{role}', to_jsonb(target_role), true)
  where id = auth.uid();

  return target_role;
end;
$$;

revoke all on function public.complete_onboarding_role(text) from public;
revoke all on function public.complete_onboarding_role(text) from anon;
grant execute on function public.complete_onboarding_role(text) to authenticated;

commit;
