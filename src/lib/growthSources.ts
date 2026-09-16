export const GROWTH_SOURCES = [
  { value: "website", label: "Strona WWW", provider: "website_lovable" },
  { value: "instagram_manychat", label: "Instagram / ManyChat", provider: "manychat" },
  { value: "linkedin_kanbox", label: "LinkedIn / Kanbox", provider: "kanbox" },
  { value: "youtube", label: "YouTube", provider: "youtube" },
  { value: "meta_ads", label: "Meta Ads", provider: "meta_ads" },
  { value: "cold_email", label: "Cold outreach", provider: "cold_outreach" },
  { value: "referral", label: "Polecenie", provider: "referral" },
  { value: "partner", label: "Partner", provider: "partner" },
  { value: "manual", label: "Ręczne", provider: "manual" },
  { value: "other", label: "Inne", provider: "other" },
] as const;

export const GROWTH_SOURCE_LABELS: Record<string, string> = Object.fromEntries(
  GROWTH_SOURCES.map((source) => [source.value, source.label]),
);

export const providerForGrowthSource = (source: string) =>
  GROWTH_SOURCES.find((item) => item.value === source)?.provider || source;

export const normalizeLegacySource = (source: string) => {
  const value = source.toLowerCase();
  if (value.includes("linkedin") || value.includes("kanbox")) return "linkedin_kanbox";
  if (value.includes("instagram") || value.includes("manychat")) return "instagram_manychat";
  if (value.includes("youtube")) return "youtube";
  if (value.includes("meta") || value.includes("facebook")) return "meta_ads";
  if (value.includes("cold") || value.includes("mail")) return "cold_email";
  if (value.includes("refer") || value.includes("polecen")) return "referral";
  if (value.includes("fotz") || value.includes("website")) return "website";
  return source || "manual";
};
