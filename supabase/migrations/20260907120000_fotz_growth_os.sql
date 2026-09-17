BEGIN;

-- One CRM record can now represent website, LinkedIn, ManyChat and other leads.
-- E-mail is optional because LinkedIn contacts often do not expose it.
ALTER TABLE public.leads
  ALTER COLUMN email DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS source_channel TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_detail TEXT,
  ADD COLUMN IF NOT EXISTS source_provider TEXT,
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS external_url TEXT,
  ADD COLUMN IF NOT EXISTS email_normalized TEXT,
  ADD COLUMN IF NOT EXISTS phone_normalized TEXT,
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT,
  ADD COLUMN IF NOT EXISTS utm_term TEXT,
  ADD COLUMN IF NOT EXISTS gclid TEXT,
  ADD COLUMN IF NOT EXISTS fbclid TEXT,
  ADD COLUMN IF NOT EXISTS msclkid TEXT,
  ADD COLUMN IF NOT EXISTS landing_page TEXT,
  ADD COLUMN IF NOT EXISTS first_touch_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_touch_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lead_score INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS consent_marketing BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_source TEXT,
  ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.leads
SET
  source_detail = COALESCE(source_detail, source),
  source_provider = COALESCE(source_provider,
    CASE
      WHEN lower(source) LIKE '%kanbox%' THEN 'kanbox'
      WHEN lower(source) LIKE '%linkedin%' THEN 'kanbox'
      WHEN lower(source) LIKE '%manychat%' THEN 'manychat'
      WHEN lower(source) LIKE '%instagram%' THEN 'manychat'
      WHEN lower(source) LIKE '%meta%' OR lower(source) LIKE '%facebook%' THEN 'meta_ads'
      WHEN lower(source) LIKE '%fotz.pl%' OR lower(source) LIKE '%website%' THEN 'website_lovable'
      ELSE source
    END
  ),
  source_channel = CASE
    WHEN lower(source) LIKE '%kanbox%' OR lower(source) LIKE '%linkedin%' THEN 'linkedin_kanbox'
    WHEN lower(source) LIKE '%manychat%' OR lower(source) LIKE '%instagram%' THEN 'instagram_manychat'
    WHEN lower(source) LIKE '%youtube%' THEN 'youtube'
    WHEN lower(source) LIKE '%meta%' OR lower(source) LIKE '%facebook%' THEN 'meta_ads'
    WHEN lower(source) LIKE '%cold%' OR lower(source) LIKE '%mail%' THEN 'cold_email'
    WHEN lower(source) LIKE '%polecen%' OR lower(source) LIKE '%referral%' THEN 'referral'
    WHEN lower(source) LIKE '%fotz.pl%' OR lower(source) LIKE '%website%' THEN 'website'
    ELSE COALESCE(NULLIF(source_channel, ''), 'manual')
  END,
  first_touch_at = COALESCE(first_touch_at, created_at),
  last_touch_at = COALESCE(last_touch_at, updated_at, created_at);

ALTER TABLE public.leads
  ALTER COLUMN first_touch_at SET DEFAULT now(),
  ALTER COLUMN first_touch_at SET NOT NULL,
  ALTER COLUMN last_touch_at SET DEFAULT now(),
  ALTER COLUMN last_touch_at SET NOT NULL;

CREATE OR REPLACE FUNCTION public.normalize_lead_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.email := NULLIF(lower(btrim(NEW.email)), '');
  NEW.email_normalized := CASE
    WHEN NEW.email IS NULL OR NEW.email = 'brak@linkedin' THEN NULL
    ELSE NEW.email
  END;
  NEW.phone := NULLIF(btrim(NEW.phone), '');
  NEW.phone_normalized := NULLIF(regexp_replace(COALESCE(NEW.phone, ''), '[^0-9]', '', 'g'), '');
  NEW.external_id := NULLIF(btrim(NEW.external_id), '');
  NEW.external_url := NULLIF(lower(btrim(NEW.external_url)), '');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalize_lead_identity_trigger ON public.leads;
CREATE TRIGGER normalize_lead_identity_trigger
BEFORE INSERT OR UPDATE OF email, phone, external_id, external_url
ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.normalize_lead_identity();

-- Backfill normalized values through the trigger.
UPDATE public.leads
SET email = email, phone = phone, external_id = external_id, external_url = external_url;

CREATE INDEX IF NOT EXISTS idx_leads_email_normalized
  ON public.leads (email_normalized) WHERE email_normalized IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_phone_normalized
  ON public.leads (phone_normalized) WHERE phone_normalized IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_external_url
  ON public.leads (external_url) WHERE external_url IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_source_external_id_unique
  ON public.leads (source_channel, external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_source_channel_created
  ON public.leads (source_channel, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_utm_campaign
  ON public.leads (utm_campaign) WHERE utm_campaign IS NOT NULL;

-- All public intake now goes through the authenticated Edge Function.
DROP POLICY IF EXISTS "Public can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Public can insert bookings" ON public.bookings;

CREATE TABLE IF NOT EXISTS public.growth_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  objective TEXT,
  offer_code TEXT,
  offer_value NUMERIC,
  target_segment TEXT,
  status TEXT NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'active', 'paused', 'completed', 'archived')),
  budget NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'PLN',
  utm_campaign TEXT UNIQUE,
  starts_on DATE,
  ends_on DATE,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.integration_sources (
  provider TEXT PRIMARY KEY,
  channel TEXT NOT NULL,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'setup_required'
    CHECK (status IN ('setup_required', 'ready', 'active', 'paused', 'error')),
  direction TEXT NOT NULL DEFAULT 'inbound'
    CHECK (direction IN ('inbound', 'outbound', 'bidirectional')),
  last_event_at TIMESTAMPTZ,
  last_error TEXT,
  setup_note TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.integration_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  channel TEXT NOT NULL,
  event_type TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  external_event_id TEXT,
  status TEXT NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'processed', 'rejected', 'failed')),
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  error_message TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processing_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.lead_touchpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  integration_event_id UUID REFERENCES public.integration_events(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.growth_campaigns(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  provider TEXT,
  source_detail TEXT,
  external_event_id TEXT,
  external_contact_id TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  gclid TEXT,
  fbclid TEXT,
  msclkid TEXT,
  content_key TEXT,
  cta_keyword TEXT,
  landing_page TEXT,
  referrer TEXT,
  message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_integration_events_provider_received
  ON public.integration_events (provider, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_integration_events_status
  ON public.integration_events (status, received_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_integration_events_external_unique
  ON public.integration_events (provider, external_event_id)
  WHERE external_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_touchpoints_lead_occurred
  ON public.lead_touchpoints (lead_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_touchpoints_channel_occurred
  ON public.lead_touchpoints (channel, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_touchpoints_campaign
  ON public.lead_touchpoints (campaign_id) WHERE campaign_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_touchpoints_integration_event_unique
  ON public.lead_touchpoints (integration_event_id);

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS external_event_id TEXT,
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT,
  ADD COLUMN IF NOT EXISTS landing_page TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_external_event_unique
  ON public.bookings (external_event_id) WHERE external_event_id IS NOT NULL;

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS offer_code TEXT,
  ADD COLUMN IF NOT EXISTS won_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.set_deal_won_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.stage = 'won' AND (TG_OP = 'INSERT' OR OLD.stage IS DISTINCT FROM 'won' OR NEW.won_at IS NULL) THEN
    NEW.won_at := COALESCE(NEW.won_at, now());
  ELSIF NEW.stage <> 'won' THEN
    NEW.won_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_deal_won_at_trigger ON public.deals;
CREATE TRIGGER set_deal_won_at_trigger
BEFORE INSERT OR UPDATE OF stage ON public.deals
FOR EACH ROW EXECUTE FUNCTION public.set_deal_won_at();

UPDATE public.deals SET won_at = COALESCE(won_at, updated_at) WHERE stage = 'won';

ALTER TABLE public.scheduled_posts
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.growth_campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS content_key TEXT,
  ADD COLUMN IF NOT EXISTS content_pillar TEXT,
  ADD COLUMN IF NOT EXISTS funnel_stage TEXT,
  ADD COLUMN IF NOT EXISTS cta_keyword TEXT,
  ADD COLUMN IF NOT EXISTS published_url TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS organic_metrics JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_campaign
  ON public.scheduled_posts (campaign_id) WHERE campaign_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_scheduled_posts_content_platform_unique
  ON public.scheduled_posts (content_key, platform)
  WHERE content_key IS NOT NULL;

ALTER TABLE public.growth_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_touchpoints ENABLE ROW LEVEL SECURITY;

-- CRM contains contact data and is exposed in the product only to managers/admins.
-- Keep the database boundary aligned with that UI rule.
DROP POLICY IF EXISTS "Team can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Team can manage leads" ON public.leads;
DROP POLICY IF EXISTS "Team can view all deals" ON public.deals;
DROP POLICY IF EXISTS "Team can manage deals" ON public.deals;
DROP POLICY IF EXISTS "Team can view contact history" ON public.contact_history;
DROP POLICY IF EXISTS "Team can manage contact history" ON public.contact_history;
DROP POLICY IF EXISTS "Team can view bookings" ON public.bookings;
DROP POLICY IF EXISTS "Team can manage bookings" ON public.bookings;

CREATE POLICY "Managers can manage leads"
  ON public.leads FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'manager'::public.app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'manager'::public.app_role)
  );
CREATE POLICY "Managers can manage deals"
  ON public.deals FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'manager'::public.app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'manager'::public.app_role)
  );
CREATE POLICY "Managers can manage contact history"
  ON public.contact_history FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'manager'::public.app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'manager'::public.app_role)
  );
CREATE POLICY "Managers can manage bookings"
  ON public.bookings FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'manager'::public.app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'manager'::public.app_role)
  );

CREATE POLICY "Team can view growth campaigns"
  ON public.growth_campaigns FOR SELECT
  USING (public.is_team_member(auth.uid()));
CREATE POLICY "Managers can manage growth campaigns"
  ON public.growth_campaigns FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'manager'::public.app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'manager'::public.app_role)
  );

CREATE POLICY "Team can view integration sources"
  ON public.integration_sources FOR SELECT
  USING (public.is_team_member(auth.uid()));
CREATE POLICY "Managers can manage integration sources"
  ON public.integration_sources FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'manager'::public.app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'manager'::public.app_role)
  );

CREATE POLICY "Managers can view integration events"
  ON public.integration_events FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'manager'::public.app_role)
  );

CREATE POLICY "Managers can view lead touchpoints"
  ON public.lead_touchpoints FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'manager'::public.app_role)
  );
CREATE POLICY "Managers can manage lead touchpoints"
  ON public.lead_touchpoints FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'manager'::public.app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'manager'::public.app_role)
  );

CREATE TRIGGER update_growth_campaigns_updated_at
BEFORE UPDATE ON public.growth_campaigns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_integration_sources_updated_at
BEFORE UPDATE ON public.integration_sources
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.integration_sources
  (provider, channel, display_name, status, direction, setup_note)
VALUES
  ('website_lovable', 'website', 'Strona FOTZ Studio (Lovable)', 'setup_required', 'inbound', 'Wdróż migrację kolejki, funkcje i sekrety, a potem wykonaj test formularza.'),
  ('kanbox', 'linkedin_kanbox', 'LinkedIn / Kanbox', 'setup_required', 'bidirectional', 'Webhook w planie Pro albo kontrolowany import CSV.'),
  ('manychat', 'instagram_manychat', 'Instagram / ManyChat', 'setup_required', 'bidirectional', 'Flow CONTENT wysyła event do CRM i zapisuje odpowiedzi.'),
  ('youtube', 'youtube', 'YouTube', 'setup_required', 'inbound', 'Dodaj UTM do opisów i potwierdź pierwszy touchpoint w CRM.'),
  ('meta_ads', 'meta_ads', 'Meta Ads', 'setup_required', 'inbound', 'Pixel/CAPI i kampanie startują po walidacji formularzy.'),
  ('cold_outreach', 'cold_email', 'Cold outreach', 'setup_required', 'bidirectional', 'Każda odpowiedź i rozmowa wraca jako touchpoint.'),
  ('referral', 'referral', 'Polecenia i partnerzy', 'ready', 'inbound', 'Ręczny formularz CRM działa bez zewnętrznej integracji.')
ON CONFLICT (provider) DO UPDATE SET
  channel = EXCLUDED.channel,
  display_name = EXCLUDED.display_name,
  setup_note = EXCLUDED.setup_note;

INSERT INTO public.growth_campaigns
  (code, name, objective, offer_code, offer_value, target_segment, status, budget, utm_campaign, notes)
VALUES
  (
    'FOTZ-GROWTH-2026-Q4',
    'FOTZ Growth Engine — start',
    'Rozmowy sprzedażowe dla pakietów 3–5 tys. PLN',
    'FOTZ-3-5K',
    4000,
    'Polskie firmy z produktem, usługą lub obiektem, które potrzebują stałego contentu',
    'planned',
    0,
    'fotz_growth_2026_q4',
    'YouTube jako rdzeń, krótkie formaty do IG/FB/LinkedIn, CTA CONTENT, Kanbox i własny CRM.'
  )
ON CONFLICT (code) DO NOTHING;

COMMIT;
