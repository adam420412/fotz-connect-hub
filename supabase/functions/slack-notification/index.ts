import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookUrl = Deno.env.get("SLACK_WEBHOOK_URL");
    
    if (!webhookUrl) {
      console.error("SLACK_WEBHOOK_URL not configured");
      return new Response(
        JSON.stringify({ error: "Slack webhook not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { message, details } = await req.json();

    console.log("Sending Slack notification:", { message, details });

    // Build Slack message blocks
    const blocks: any[] = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: message,
        },
      },
    ];

    // Add details as fields if provided
    if (details && Object.keys(details).length > 0) {
      const fields = Object.entries(details).map(([key, value]) => ({
        type: "mrkdwn",
        text: `*${key}:*\n${value}`,
      }));

      blocks.push({
        type: "section",
        fields,
      });
    }

    // Add timestamp footer
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `📅 ${new Date().toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" })}`,
        },
      ],
    });

    const slackPayload = {
      blocks,
      text: message, // Fallback text
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(slackPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Slack API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to send Slack notification", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Slack notification sent successfully");

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in slack-notification function:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
