-- Tijvorya v3.4: enforce admin sub-role permissions at the database level.
--
-- The admin panel already hides sections a staff member's admin_role isn't
-- assigned (see src/lib/admin-permissions.ts) - e.g. a "finance_manager"
-- never sees a "Suspend store" button, a "content_moderator" never sees
-- order management. But every RLS policy that gates an admin write only
-- checked public.is_admin(), which is true for ANY assigned admin_role.
-- That means the section restriction was UI-only: a signed-in staff member
-- with ANY admin role could call the Supabase client directly (browser
-- devtools, or a script using their own session) and suspend a store,
-- moderate a reel, or change an order's status even though their assigned
-- role was never meant to allow it.
--
-- This adds public.admin_can(section) - a server-side mirror of the same
-- section matrix already defined in admin-permissions.ts - and uses it to
-- narrow the admin branch of the write-only policies that don't overlap
-- with normal store-owner/merchant behavior (so "manage as merchant"
-- impersonation, which relies on the is_admin() branch of the *owner*
-- policies for stores/products, is untouched and keeps working exactly as
-- before for any admin role that can reach it through the gated UI).
--
-- Read access for admins is intentionally left broad (unchanged) - every
-- admin role's "reports"/"overview" screens legitimately cross-reference
-- stores/products/orders, and narrowing SELECT policies risks breaking
-- that cross-visibility in ways that are hard to verify without a live
-- database to test against.

create or replace function public.admin_can(p_section text)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select case (select admin_role from public.profiles where id = auth.uid() and role = 'admin' and status = 'active')
      when 'super_admin' then true
      when 'content_moderator' then p_section in ('reels', 'products')
      when 'store_manager' then p_section in ('stores', 'products', 'orders')
      when 'customer_support' then p_section in ('orders', 'users', 'messages')
      when 'finance_manager' then p_section in ('orders')
      else false
    end
  ), false);
$$;
revoke all on function public.admin_can(text) from public;
grant execute on function public.admin_can(text) to authenticated;

-- Stores: owners always keep full control of their own store; the admin
-- branch now additionally requires the "stores" section.
drop policy if exists "stores owner write" on public.stores;
create policy "stores owner write" on public.stores for all
using (owner_id = auth.uid() or (public.is_admin() and public.admin_can('stores')))
with check (owner_id = auth.uid() or (public.is_admin() and public.admin_can('stores')));

-- Products: same pattern, gated to the "products" section.
drop policy if exists "products owner write" on public.products;
create policy "products owner write" on public.products for all
using (public.owns_store(store_id) or (public.is_admin() and public.admin_can('products')))
with check (public.owns_store(store_id) or (public.is_admin() and public.admin_can('products')));

-- Reel moderation (approve/reject) is an admin-only action with no owner
-- overlap (owners already have their own separate "reels owner update"
-- policy) - gate it to the "reels" section.
drop policy if exists "reels admin moderate" on public.reels;
create policy "reels admin moderate" on public.reels for update
using (public.is_admin() and public.admin_can('reels'))
with check (public.is_admin() and public.admin_can('reels'));

-- Orders: store owners always keep control of their own orders; the admin
-- branch (used by the admin Orders page to change status, or delete) now
-- requires the "orders" section.
drop policy if exists "orders merchant update" on public.orders;
create policy "orders merchant update" on public.orders for update
using (public.owns_store(store_id) or (public.is_admin() and public.admin_can('orders')))
with check (public.owns_store(store_id) or (public.is_admin() and public.admin_can('orders')));

drop policy if exists "orders merchant delete" on public.orders;
create policy "orders merchant delete" on public.orders for delete
using (public.owns_store(store_id) or (public.is_admin() and public.admin_can('orders')));

-- Messages: an admin replying as "admin" in the support inbox now
-- requires the "messages" section (customer_support/super_admin only,
-- matching the matrix). Customer and merchant sending is unaffected.
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
        or (messages.sender_role = 'admin' and public.is_admin() and public.admin_can('messages'))
      )
  )
);
