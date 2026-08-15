-- Tijvorya Platform v2.1.0
-- Merchant onboarding + professional three-page merchant websites
begin;

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

commit;
