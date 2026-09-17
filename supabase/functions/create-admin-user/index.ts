import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const responseHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

// Bootstrap through a public endpoint made a service-role operation reachable
// from the internet and exposed a shared password. Keep the deployed function
// inert so an old deployment command cannot recreate that vulnerability.
serve(() => new Response(
  JSON.stringify({
    success: false,
    error: "ENDPOINT_DISABLED",
    message: "Administrator accounts must be provisioned with a one-time invitation.",
  }),
  { status: 410, headers: responseHeaders },
));
