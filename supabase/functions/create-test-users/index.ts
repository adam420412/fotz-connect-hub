import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const responseHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

// Production deployments must never create predictable test identities.
serve(() => new Response(
  JSON.stringify({
    success: false,
    error: "ENDPOINT_DISABLED",
    message: "Test users must be created only in an isolated local Supabase project.",
  }),
  { status: 410, headers: responseHeaders },
));
