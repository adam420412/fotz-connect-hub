import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type JsonObject = Record<string, unknown>;

// Preserve the instantiated client's schema defaults when retaining it for error handling.
const createServiceClient = (url: string, key: string) => createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type NormalizedEvent = {
  eventType: "lead.captured" | "booking.created" | "lead.touchpoint";
  provider: string;
  channel: string;
  sourceDetail: string;
  externalEventId: string | null;
  externalContactId: string | null;
  idempotencyKey: string;
  occurredAt: string;
  leadScore: number;
  contact: {
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    externalUrl: string | null;
  };
  attribution: {
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
    utmContent: string | null;
    utmTerm: string | null;
    gclid: string | null;
    fbclid: string | null;
    msclkid: string | null;
    contentKey: string | null;
    ctaKeyword: string | null;
    landingPage: string | null;
    referrer: string | null;
  };
  booking: {
    date: string | null;
    time: string | null;
    serviceType: string | null;
  };
  message: string | null;
  consent: {
    marketing: boolean;
    source: string | null;
    at: string | null;
  };
  metadata: JsonObject;
};

const DEFAULT_ALLOWED_ORIGINS = [
  "https://fotz-studio-web-experience.lovable.app",
  "https://fotz.pl",
  "https://www.fotz.pl",
  "http://localhost:8080",
  "http://localhost:5173",
];

const asObject = (value: unknown): JsonObject =>
  value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {};

const asString = (value: unknown, maxLength = 500): string | null => {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const clean = String(value).trim();
  return clean ? clean.slice(0, maxLength) : null;
};

const pickString = (maxLength: number, ...values: unknown[]): string | null => {
  for (const value of values) {
    const clean = asString(value, maxLength);
    if (clean) return clean;
  }
  return null;
};

const asScore = (value: unknown): number | null => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.min(100, Math.round(parsed)));
};

const normalizeEmail = (value: unknown): string | null => {
  const email = asString(value, 320)?.toLowerCase() ?? null;
  if (!email || email === "brak@linkedin") return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
};

const normalizePhone = (value: unknown): string | null => {
  const phone = asString(value, 40);
  if (!phone || phone.toLowerCase() === "nie podano") return null;
  return phone;
};

const normalizedPhoneDigits = (value: string | null): string | null => {
  const digits = value?.replace(/\D/g, "") ?? "";
  return digits.length >= 7 ? digits : null;
};

const normalizeChannel = (raw: string | null): string => {
  const value = (raw ?? "").toLowerCase();
  if (value.includes("kanbox") || value.includes("linkedin")) return "linkedin_kanbox";
  if (value.includes("manychat") || value.includes("instagram") || value === "ig") return "instagram_manychat";
  if (value.includes("youtube")) return "youtube";
  if (value.includes("meta") || value.includes("facebook")) return "meta_ads";
  if (value.includes("cold") || value.includes("outreach")) return "cold_email";
  if (value.includes("refer") || value.includes("polecen")) return "referral";
  if (value.includes("fotz") || value.includes("website") || value.includes("lovable") || value.startsWith("/")) return "website";
  return value.replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80) || "manual";
};

const providerForChannel = (channel: string): string => ({
  website: "website_lovable",
  linkedin_kanbox: "kanbox",
  instagram_manychat: "manychat",
  meta_ads: "meta_ads",
  youtube: "youtube",
  cold_email: "cold_outreach",
  referral: "referral",
}[channel] ?? channel);

const displayNameForProvider = (provider: string): string => ({
  website_lovable: "Strona FOTZ Studio (Lovable)",
  kanbox: "LinkedIn / Kanbox",
  manychat: "Instagram / ManyChat",
  meta_ads: "Meta Ads",
  youtube: "YouTube",
  cold_outreach: "Cold outreach",
  referral: "Polecenia i partnerzy",
}[provider] ?? provider);

const validIsoDate = (value: string | null): string | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const sha256 = async (value: string): Promise<string> => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

const getAllowedOrigins = (): Set<string> => {
  const configured = (Deno.env.get("CRM_ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return new Set(configured.length ? configured : DEFAULT_ALLOWED_ORIGINS);
};

const corsHeaders = (req: Request): Record<string, string> => {
  const origin = req.headers.get("origin");
  const allowed = getAllowedOrigins();
  return {
    "Access-Control-Allow-Origin": origin && allowed.has(origin) ? origin : DEFAULT_ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, idempotency-key, x-client-info, x-webhook-secret",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
};

const jsonResponse = (req: Request, body: JsonObject, status = 200) => new Response(
  JSON.stringify(body),
  { status, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
);

const hasValidSecret = (req: Request): boolean => {
  const expected = Deno.env.get("CRM_WEBHOOK_SECRET") ?? "";
  if (!expected) return false;
  const authorization = req.headers.get("authorization") ?? "";
  const bearer = authorization.toLowerCase().startsWith("bearer ") ? authorization.slice(7).trim() : "";
  const supplied = req.headers.get("x-webhook-secret") || bearer;
  return supplied.length === expected.length && supplied === expected;
};

const mayUseLegacyPublicIntake = (req: Request): boolean => {
  if ((Deno.env.get("CRM_ALLOW_LEGACY_PUBLIC") ?? "false").toLowerCase() !== "true") return false;
  const origin = req.headers.get("origin");
  return Boolean(origin && getAllowedOrigins().has(origin));
};

const normalizeEvent = async (payload: JsonObject, req: Request): Promise<NormalizedEvent> => {
  const data = asObject(payload.data);
  const sourceObject = asObject(payload.source);
  const contactObject = asObject(payload.contact);
  const attributionObject = asObject(payload.attribution);
  const bookingObject = asObject(payload.booking);
  const consentObject = asObject(payload.consent);
  const customFields = asObject(payload.custom_fields);
  const root = Object.keys(contactObject).length ? contactObject : (Object.keys(data).length ? data : payload);

  const legacyType = pickString(80, payload.type, payload.event_type, payload.eventType);
  const eventType = legacyType === "booking" || legacyType === "booking.created"
    ? "booking.created"
    : legacyType === "lead.touchpoint" || legacyType === "touchpoint"
      ? "lead.touchpoint"
      : "lead.captured";

  const rawSource = pickString(
    300,
    sourceObject.channel,
    payload.source_channel,
    data.source_channel,
    typeof payload.source === "string" ? payload.source : null,
    data.source,
    payload.provider,
  );
  const channel = normalizeChannel(rawSource);
  const provider = pickString(80, sourceObject.provider, payload.source_provider, payload.provider)
    ?.toLowerCase().replace(/[^a-z0-9_]+/g, "_") ?? providerForChannel(channel);
  const sourceDetail = pickString(
    300,
    sourceObject.detail,
    payload.source_detail,
    data.source_detail,
    typeof payload.source === "string" ? payload.source : null,
    data.source,
    attributionObject.page_path,
    "manual",
  )!;

  const firstName = pickString(120, root.first_name, payload.first_name);
  const lastName = pickString(120, root.last_name, payload.last_name);
  const email = normalizeEmail(root.email ?? data.email ?? payload.email ?? customFields.email);
  const phone = normalizePhone(root.phone ?? data.phone ?? payload.phone ?? customFields.phone);
  const company = pickString(240, root.company, data.company, payload.company, customFields.company);
  const externalUrl = pickString(
    1000,
    root.external_url,
    root.linkedin_url,
    data.linkedin_url,
    payload.linkedin_url,
    sourceObject.profile_url,
  )?.toLowerCase() ?? null;
  const externalContactId = pickString(
    240,
    sourceObject.external_contact_id,
    root.external_id,
    data.external_id,
    payload.external_contact_id,
    payload.subscriber_id,
    payload.contact_id,
    payload.profile_id,
  );
  const externalEventId = pickString(
    240,
    sourceObject.external_event_id,
    payload.external_event_id,
    payload.event_id,
    payload.submission_id,
    payload.id,
  );

  const name = pickString(
    240,
    root.name,
    root.full_name,
    payload.crm_name,
    data.name,
    payload.name,
    [firstName, lastName].filter(Boolean).join(" "),
    root.instagram_username,
    payload.instagram_username,
    company,
    email?.split("@")[0],
    `Kontakt z ${channel}`,
  )!;

  if (!email && !phone && !externalContactId && !externalUrl) {
    throw new Error("MISSING_CONTACT_IDENTITY");
  }

  const occurredAt = validIsoDate(pickString(80, payload.occurred_at, payload.timestamp, data.occurred_at))
    ?? new Date().toISOString();
  const requestedKey = pickString(300, req.headers.get("idempotency-key"), payload.idempotency_key);
  const fallbackKey = await sha256(JSON.stringify({ payload, provider, eventType }));
  const idempotencyKey = `${provider}:${requestedKey ?? externalEventId ?? fallbackKey}`.slice(0, 500);

  const qualification = {
    industry: pickString(240, customFields.industry, root.industry, payload.industry),
    goal: pickString(1000, customFields.goal, root.goal, payload.goal),
    delivery_model: pickString(240, customFields.delivery_model, customFields.execution, payload.delivery_model),
    timing: pickString(240, customFields.timing, root.timing, payload.timing),
    budget: pickString(240, customFields.budget, customFields.budget_range, root.budget, payload.budget),
    decision_role: pickString(240, customFields.decision_role, root.decision_role, payload.decision_role),
  };
  const qualificationText = Object.values(qualification).filter(Boolean).join(" ").toLowerCase();
  const targetBudget = /(3\s*[-–]\s*5\s*k|3\s*000|4\s*000|5\s*000|3000|4000|5000|powyżej\s*3|above\s*3)/i.test(qualificationText);
  const nearTerm = /(teraz|jak najszybciej|30 dni|ten miesiąc|1\s*[-–]\s*3 mies|this month|asap)/i.test(qualificationText);
  const decisionMaker = /(właściciel|wlasciciel|founder|owner|ceo|decyduję|decyduje|decision maker)/i.test(qualificationText);
  const calculatedScore = Math.min(100,
    10
    + (email ? 5 : 0)
    + (phone ? 5 : 0)
    + (company ? 10 : 0)
    + (qualification.goal ? 10 : 0)
    + (targetBudget ? 30 : 0)
    + (nearTerm ? 15 : 0)
    + (decisionMaker ? 15 : 0)
    + (eventType === "booking.created" ? 50 : 0)
  );
  const leadScore = asScore(payload.lead_score ?? data.lead_score ?? customFields.lead_score) ?? calculatedScore;

  const metadata = {
    ...asObject(payload.metadata),
    form_name: pickString(240, payload.form_name, data.form_name),
    topic: pickString(500, payload.topic, data.topic),
    selected_services: payload.selected_services ?? data.selected_services ?? null,
    price_estimate: payload.price_estimate ?? data.price_estimate ?? null,
    qualification,
    offer_id: pickString(80, payload.offer_id, data.offer_id),
    contact_request: payload.contact_request === true,
    privacy_version: pickString(80, payload.privacy_version),
    analytics_consent: asObject(payload.consent).analytics === true,
  };

  return {
    eventType,
    provider,
    channel,
    sourceDetail,
    externalEventId,
    externalContactId,
    idempotencyKey,
    occurredAt,
    leadScore,
    contact: { name, email, phone, company, externalUrl },
    attribution: {
      utmSource: pickString(240, attributionObject.utm_source, root.utm_source, data.utm_source, payload.utm_source),
      utmMedium: pickString(240, attributionObject.utm_medium, root.utm_medium, data.utm_medium, payload.utm_medium),
      utmCampaign: pickString(240, attributionObject.utm_campaign, root.utm_campaign, data.utm_campaign, payload.utm_campaign),
      utmContent: pickString(240, attributionObject.utm_content, root.utm_content, data.utm_content, payload.utm_content),
      utmTerm: pickString(240, attributionObject.utm_term, root.utm_term, data.utm_term, payload.utm_term),
      gclid: pickString(300, attributionObject.gclid, root.gclid, data.gclid, payload.gclid),
      fbclid: pickString(300, attributionObject.fbclid, root.fbclid, data.fbclid, payload.fbclid),
      msclkid: pickString(300, attributionObject.msclkid, root.msclkid, data.msclkid, payload.msclkid),
      contentKey: pickString(240, attributionObject.content_key, payload.content_key, data.content_key),
      ctaKeyword: pickString(120, attributionObject.cta_keyword, payload.cta_keyword, data.cta_keyword),
      landingPage: pickString(1500, attributionObject.landing_page, attributionObject.page_url, payload.landing_page, payload.page_url, data.landing_page),
      referrer: pickString(1500, attributionObject.referrer, payload.referrer, data.referrer),
    },
    booking: {
      date: pickString(20, bookingObject.date, bookingObject.booking_date, data.booking_date, payload.booking_date),
      time: pickString(20, bookingObject.time, bookingObject.booking_time, data.booking_time, payload.booking_time),
      serviceType: pickString(160, bookingObject.service_type, data.service_type, payload.service_type),
    },
    message: pickString(8000, payload.message, data.message, payload.notes, data.notes, customFields.message),
    consent: {
      marketing: consentObject.marketing === true || payload.consent_marketing === true || data.consent_marketing === true,
      source: pickString(240, consentObject.source, payload.consent_source, data.consent_source),
      at: validIsoDate(pickString(80, consentObject.at, payload.consent_at, data.consent_at)),
    },
    metadata,
  };
};

const compactEventForStorage = (event: NormalizedEvent): JsonObject => ({
  event_type: event.eventType,
  source: {
    provider: event.provider,
    channel: event.channel,
    detail: event.sourceDetail,
    external_event_id: event.externalEventId,
    external_contact_id: event.externalContactId,
  },
  contact: {
    name: event.contact.name,
    email: event.contact.email,
    phone: event.contact.phone,
    company: event.contact.company,
    external_url: event.contact.externalUrl,
  },
  attribution: event.attribution,
  booking: event.eventType === "booking.created" ? event.booking : null,
  message: event.message,
  consent: event.consent,
  metadata: event.metadata,
  occurred_at: event.occurredAt,
  lead_score: event.leadScore,
});

const sendWebhookNotification = async (event: NormalizedEvent) => {
  if (Deno.env.get("ENABLE_EXTERNAL_CRM_NOTIFICATIONS") !== "true") return;
  const webhookUrl = Deno.env.get("DISCORD_WEBHOOK_URL") || Deno.env.get("SLACK_WEBHOOK_URL");
  if (!webhookUrl) return;

  const isBooking = event.eventType === "booking.created";
  const title = isBooking ? "📅 Nowa rezerwacja" : "🎯 Nowy sygnał sprzedażowy";
  const contactLines = [
    `*${event.contact.name}*`,
    event.contact.email ? `📧 ${event.contact.email}` : null,
    event.contact.phone ? `📱 ${event.contact.phone}` : null,
    event.contact.company ? `🏢 ${event.contact.company}` : null,
    `📍 ${event.channel} · ${event.sourceDetail}`,
    isBooking ? `📅 ${event.booking.date} ${event.booking.time}` : null,
  ].filter(Boolean).join("\n");

  try {
    if (webhookUrl.includes("discord.com")) {
      await fetch(webhookUrl, {
        method: "POST",
        signal: AbortSignal.timeout(4000),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [{ title, description: contactLines.replace(/\*/g, "**"), color: 0x741443 }] }),
      });
    } else {
      await fetch(webhookUrl, {
        method: "POST",
        signal: AbortSignal.timeout(4000),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `${title}\n${contactLines}` }),
      });
    }
  } catch (error) {
    console.error("[crm-webhook] notification failed", error instanceof Error ? error.message : "unknown");
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    const origin = req.headers.get("origin");
    if (origin && !getAllowedOrigins().has(origin)) return new Response(null, { status: 403 });
    return new Response(null, { headers: corsHeaders(req) });
  }
  if (req.method !== "POST") return jsonResponse(req, { success: false, error: "METHOD_NOT_ALLOWED" }, 405);

  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > 64_000) return jsonResponse(req, { success: false, error: "PAYLOAD_TOO_LARGE" }, 413);
  if (!hasValidSecret(req) && !mayUseLegacyPublicIntake(req)) {
    const configured = Boolean(Deno.env.get("CRM_WEBHOOK_SECRET"));
    return jsonResponse(req, { success: false, error: configured ? "UNAUTHORIZED" : "WEBHOOK_NOT_CONFIGURED" }, configured ? 401 : 503);
  }

  let eventId: string | null = null;
  let supabase: ReturnType<typeof createServiceClient> | null = null;

  try {
    const rawBody = await req.text();
    if (rawBody.length > 64_000) return jsonResponse(req, { success: false, error: "PAYLOAD_TOO_LARGE" }, 413);

    let payload: JsonObject;
    try {
      payload = asObject(JSON.parse(rawBody));
    } catch {
      return jsonResponse(req, { success: false, error: "INVALID_JSON" }, 400);
    }

    const event = await normalizeEvent(payload, req);
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) throw new Error("SUPABASE_SERVER_CONFIG_MISSING");
    supabase = createServiceClient(supabaseUrl, serviceRoleKey);

    const { data: insertedEvent, error: eventInsertError } = await supabase
      .from("integration_events")
      .insert({
        provider: event.provider,
        channel: event.channel,
        event_type: event.eventType,
        idempotency_key: event.idempotencyKey,
        external_event_id: event.externalEventId,
        status: "processing",
        payload: compactEventForStorage(event),
      })
      .select("id, status, lead_id, booking_id")
      .single();

    if (eventInsertError) {
      if (eventInsertError.code !== "23505") throw eventInsertError;
      const byKey = await supabase
        .from("integration_events")
        .select("id, status, lead_id, booking_id, processing_started_at")
        .eq("idempotency_key", event.idempotencyKey)
        .maybeSingle();
      let existingEvent = byKey.data;
      if (!existingEvent && event.externalEventId) {
        const byExternalId = await supabase
          .from("integration_events")
          .select("id, status, lead_id, booking_id, processing_started_at")
          .eq("provider", event.provider)
          .eq("external_event_id", event.externalEventId)
          .maybeSingle();
        existingEvent = byExternalId.data;
      }

      if (existingEvent?.status === "processed") {
        return jsonResponse(req, {
          success: true,
          duplicate_event: true,
          event_id: existingEvent.id,
          lead_id: existingEvent.lead_id,
          booking_id: existingEvent.booking_id,
        });
      }
      if (existingEvent?.status === "processing") {
        const processingStartedAt = new Date(String(existingEvent.processing_started_at || "")).getTime();
        const isStale = Number.isFinite(processingStartedAt) && Date.now() - processingStartedAt > 2 * 60_000;
        if (!isStale) {
          return jsonResponse(req, {
            success: false,
            error: "EVENT_PROCESSING",
            event_id: existingEvent.id,
          }, 409);
        }
      }
      if (!existingEvent) throw eventInsertError;
      eventId = existingEvent.id;
      const { error: reclaimError } = await supabase.from("integration_events")
        .update({
          status: "processing",
          error_message: null,
          processed_at: null,
          processing_started_at: new Date().toISOString(),
        })
        .eq("id", eventId);
      if (reclaimError) throw reclaimError;
    } else {
      eventId = insertedEvent.id;
    }

    const selectLead = "id, name, email, phone, company, source_channel, source_detail, source_provider, external_id, external_url, notes, status, lead_score, consent_marketing, consent_source, consent_at, metadata, next_step, next_step_date";
    let existingLead: JsonObject | null = null;

    if (event.externalContactId) {
      const { data } = await supabase.from("leads").select(selectLead)
        .eq("source_channel", event.channel).eq("external_id", event.externalContactId).limit(1);
      existingLead = data?.[0] ?? null;
    }
    if (!existingLead && event.contact.email) {
      const { data } = await supabase.from("leads").select(selectLead)
        .eq("email_normalized", event.contact.email).limit(1);
      existingLead = data?.[0] ?? null;
    }
    const phoneDigits = normalizedPhoneDigits(event.contact.phone);
    if (!existingLead && phoneDigits) {
      const { data } = await supabase.from("leads").select(selectLead)
        .eq("phone_normalized", phoneDigits).limit(1);
      existingLead = data?.[0] ?? null;
    }
    if (!existingLead && event.contact.externalUrl) {
      const { data } = await supabase.from("leads").select(selectLead)
        .eq("external_url", event.contact.externalUrl).limit(1);
      existingLead = data?.[0] ?? null;
    }

    let leadId: string;
    let isNewLead = false;
    if (existingLead) {
      leadId = String(existingLead.id);
      const updates: JsonObject = {
        last_touch_at: event.occurredAt,
        updated_at: new Date().toISOString(),
        metadata: { ...asObject(existingLead.metadata), ...event.metadata },
      };
      if (!existingLead.email && event.contact.email) updates.email = event.contact.email;
      if (!existingLead.phone && event.contact.phone) updates.phone = event.contact.phone;
      if (!existingLead.company && event.contact.company) updates.company = event.contact.company;
      if (!existingLead.external_id && event.externalContactId) updates.external_id = event.externalContactId;
      if (!existingLead.external_url && event.contact.externalUrl) updates.external_url = event.contact.externalUrl;
      const previousScore = Number(existingLead.lead_score || 0);
      if (event.leadScore > previousScore) updates.lead_score = event.leadScore;
      // Completeness/booking score is prioritization, not human qualification.
      if (!existingLead.next_step && ["new", "contacted"].includes(String(existingLead.status))) {
        updates.next_step = "Skontaktuj się i potwierdź zakres, budżet oraz termin";
        updates.next_step_date = new Date().toISOString();
      }
      if (event.consent.marketing && !existingLead.consent_marketing) {
        updates.consent_marketing = true;
        updates.consent_source = event.consent.source;
        updates.consent_at = event.consent.at ?? event.occurredAt;
      }
      const { error } = await supabase.from("leads").update(updates).eq("id", leadId);
      if (error) throw error;
    } else {
      const { data: lead, error } = await supabase.from("leads").insert({
        name: event.contact.name,
        email: event.contact.email,
        phone: event.contact.phone,
        company: event.contact.company,
        source: event.sourceDetail,
        source_channel: event.channel,
        source_detail: event.sourceDetail,
        source_provider: event.provider,
        external_id: event.externalContactId,
        external_url: event.contact.externalUrl,
        status: "new",
        next_step: "Skontaktuj się i potwierdź zakres, budżet oraz termin",
        next_step_date: new Date().toISOString(),
        lead_score: event.leadScore,
        notes: event.message,
        utm_source: event.attribution.utmSource,
        utm_medium: event.attribution.utmMedium,
        utm_campaign: event.attribution.utmCampaign,
        utm_content: event.attribution.utmContent,
        utm_term: event.attribution.utmTerm,
        gclid: event.attribution.gclid,
        fbclid: event.attribution.fbclid,
        msclkid: event.attribution.msclkid,
        landing_page: event.attribution.landingPage,
        first_touch_at: event.occurredAt,
        last_touch_at: event.occurredAt,
        consent_marketing: event.consent.marketing,
        consent_source: event.consent.source,
        consent_at: event.consent.marketing ? (event.consent.at ?? event.occurredAt) : null,
        metadata: event.metadata,
      }).select("id").single();
      if (error) throw error;
      leadId = lead.id;
      isNewLead = true;
    }

    let campaignId: string | null = null;
    if (event.attribution.utmCampaign) {
      const { data } = await supabase.from("growth_campaigns").select("id")
        .eq("utm_campaign", event.attribution.utmCampaign).limit(1);
      campaignId = data?.[0]?.id ?? null;
    }

    const { data: previousTouchpoint, error: previousTouchpointError } = await supabase
      .from("lead_touchpoints")
      .select("id")
      .eq("integration_event_id", eventId)
      .maybeSingle();
    if (previousTouchpointError) throw previousTouchpointError;

    const { error: touchpointError } = await supabase.from("lead_touchpoints").upsert({
      lead_id: leadId,
      integration_event_id: eventId,
      campaign_id: campaignId,
      event_type: event.eventType,
      channel: event.channel,
      provider: event.provider,
      source_detail: event.sourceDetail,
      external_event_id: event.externalEventId,
      external_contact_id: event.externalContactId,
      utm_source: event.attribution.utmSource,
      utm_medium: event.attribution.utmMedium,
      utm_campaign: event.attribution.utmCampaign,
      utm_content: event.attribution.utmContent,
      utm_term: event.attribution.utmTerm,
      gclid: event.attribution.gclid,
      fbclid: event.attribution.fbclid,
      msclkid: event.attribution.msclkid,
      content_key: event.attribution.contentKey,
      cta_keyword: event.attribution.ctaKeyword,
      landing_page: event.attribution.landingPage,
      referrer: event.attribution.referrer,
      message: event.message,
      metadata: event.metadata,
      occurred_at: event.occurredAt,
    }, { onConflict: "integration_event_id" });
    if (touchpointError) throw touchpointError;

    if (!previousTouchpoint) {
      const { error: historyError } = await supabase.from("contact_history").insert({
        lead_id: leadId,
        contact_type: event.eventType === "booking.created" ? "booking" : event.channel,
        subject: `${event.eventType} · ${event.sourceDetail}`,
        content: event.message || `Zdarzenie z kanału ${event.channel}`,
        contact_date: event.occurredAt,
      });
      if (historyError) {
        // The touchpoint is the canonical attribution record. A secondary timeline
        // entry must not make a successfully accepted lead retry forever.
        console.error("[crm-webhook] contact history write failed", {
          event_id: eventId,
          error: historyError.message,
        });
      }
    }

    let bookingId: string | null = null;
    let isNewBooking = false;
    if (event.eventType === "booking.created") {
      if (!event.contact.email || !event.booking.date || !event.booking.time) {
        throw new Error("BOOKING_FIELDS_MISSING");
      }
      const bookingExternalId = event.externalEventId || event.idempotencyKey;
      const { data: existingBooking, error: existingBookingError } = await supabase
        .from("bookings")
        .select("id")
        .eq("external_event_id", bookingExternalId)
        .maybeSingle();
      if (existingBookingError) throw existingBookingError;
      if (existingBooking) {
        bookingId = existingBooking.id;
      } else {
        const { data: booking, error } = await supabase.from("bookings").insert({
          client_name: event.contact.name,
          client_email: event.contact.email,
          client_phone: event.contact.phone,
          booking_date: event.booking.date,
          booking_time: event.booking.time,
          service_type: event.booking.serviceType || "konsultacja",
          notes: event.message,
          source: event.sourceDetail,
          status: "pending",
          lead_id: leadId,
          external_event_id: bookingExternalId,
          utm_source: event.attribution.utmSource,
          utm_medium: event.attribution.utmMedium,
          utm_campaign: event.attribution.utmCampaign,
          utm_content: event.attribution.utmContent,
          landing_page: event.attribution.landingPage,
          metadata: event.metadata,
        }).select("id").single();
        if (error) {
          if (error.code !== "23505") throw error;
          const { data: concurrentBooking, error: lookupError } = await supabase
            .from("bookings")
            .select("id")
            .eq("external_event_id", bookingExternalId)
            .single();
          if (lookupError) throw lookupError;
          bookingId = concurrentBooking.id;
        } else {
          bookingId = booking.id;
          isNewBooking = true;
        }
      }
    }

    const { error: processedError } = await supabase.from("integration_events").update({
      status: "processed",
      lead_id: leadId,
      booking_id: bookingId,
      processed_at: new Date().toISOString(),
      error_message: null,
    }).eq("id", eventId);
    if (processedError) throw processedError;

    await supabase.from("integration_sources").upsert({
      provider: event.provider,
      channel: event.channel,
      display_name: displayNameForProvider(event.provider),
      status: "active",
      last_event_at: event.occurredAt,
      last_error: null,
    }, { onConflict: "provider" });

    if (isNewLead || isNewBooking) await sendWebhookNotification(event);

    console.log("[crm-webhook] processed", {
      event_id: eventId,
      event_type: event.eventType,
      provider: event.provider,
      channel: event.channel,
      lead_id: leadId,
      new_lead: isNewLead,
    });

    return jsonResponse(req, {
      success: true,
      event_id: eventId,
      lead_id: leadId,
      booking_id: bookingId,
      new_lead: isNewLead,
    }, isNewLead ? 201 : 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    if (supabase && eventId) {
      await supabase.from("integration_events").update({
        status: "failed",
        error_message: message.slice(0, 1000),
        processed_at: new Date().toISOString(),
      }).eq("id", eventId);
    }
    console.error("[crm-webhook] failed", { event_id: eventId, error: message });
    const publicError = message === "MISSING_CONTACT_IDENTITY" || message === "BOOKING_FIELDS_MISSING"
      ? message
      : "PROCESSING_FAILED";
    return jsonResponse(req, { success: false, error: publicError, event_id: eventId }, publicError === message ? 400 : 500);
  }
});
