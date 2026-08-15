-- Tijvorya Platform v2.2
-- Merchant wildcard-domain metadata and professional business identity fields.
-- The store website profile is JSONB, so no destructive schema change is required.
begin;

update public.stores
set website = coalesce(website, '{}'::jsonb)
  || jsonb_build_object(
    'domain', coalesce(nullif(website->>'domain', ''), slug || '.tijvorya.com'),
    'legalName', coalesce(website->>'legalName', ''),
    'registrationNumber', coalesce(website->>'registrationNumber', '')
  );

commit;
