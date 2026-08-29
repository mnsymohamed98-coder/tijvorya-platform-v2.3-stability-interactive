-- Tijvorya v2.9: reel_comments/reel_likes/reel_events were created (in
-- migrations 20260724_v1_8_smart_reels.sql and 20260829_v2_7_reel_
-- engagement.sql) with RLS policies but no table-level GRANTs. In Postgres
-- these are two independent, additive requirements - a policy permitting
-- an operation is irrelevant if the role has no grant to attempt it at
-- all. Every request against these three tables was failing with a flat
-- 403, including plain SELECTs that RLS would otherwise have allowed
-- (confirmed live: RLS filtering a row returns an empty 200, not a 403 -
-- the 403 was the signature of the missing grant, not the policies).
grant select on public.reel_comments to anon, authenticated;
grant insert on public.reel_comments to authenticated;

grant select on public.reel_likes to anon, authenticated;
grant insert, delete on public.reel_likes to authenticated;

-- insert allows auth.uid() = user_id OR user_id is null (an anonymous view
-- still needs to be recordable), so anon needs the insert grant too.
grant insert on public.reel_events to anon, authenticated;
grant select on public.reel_events to authenticated;
