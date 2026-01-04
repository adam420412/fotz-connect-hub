import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface LeadPayload {
  type: "lead" | "booking";
  data: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    source?: string;
    notes?: string;
    booking_date?: string;
    booking_time?: string;
    service_type?: string;
  };
}

// Send notification to Discord/Slack webhook
async function sendWebhookNotification(type: "lead" | "booking", data: Record<string, unknown>) {
  const webhookUrl = Deno.env.get("DISCORD_WEBHOOK_URL") || Deno.env.get("SLACK_WEBHOOK_URL");
  
  if (!webhookUrl) {
    console.log("No webhook URL configured, skipping notification");
    return;
  }

  const isDiscord = webhookUrl.includes("discord.com");
  const emoji = type === "lead" ? "🎯" : "📅";
  const title = type === "lead" ? "Nowy Lead!" : "Nowa Rezerwacja!";
  
  let message = "";
  if (type === "lead") {
    message = `**${data.name}**\n📧 ${data.email}${data.phone ? `\n📱 ${data.phone}` : ""}${data.company ? `\n🏢 ${data.company}` : ""}\n📍 Źródło: ${data.source || "fotz.pl"}`;
  } else {
    message = `**${data.name}**\n📧 ${data.email}${data.phone ? `\n📱 ${data.phone}` : ""}\n📅 ${data.booking_date} o ${data.booking_time}\n🔧 ${data.service_type || "konsultacja"}`;
  }

  try {
    if (isDiscord) {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [{
            title: `${emoji} ${title}`,
            description: message,
            color: type === "lead" ? 0x22c55e : 0x3b82f6,
            timestamp: new Date().toISOString(),
          }],
        }),
      });
    } else {
      // Slack format
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocks: [
            {
              type: "header",
              text: { type: "plain_text", text: `${emoji} ${title}`, emoji: true },
            },
            {
              type: "section",
              text: { type: "mrkdwn", text: message.replace(/\*\*/g, "*") },
            },
          ],
        }),
      });
    }
    console.log("Webhook notification sent successfully");
  } catch (error) {
    console.error("Failed to send webhook notification:", error);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const payload: LeadPayload = await req.json();
    
    console.log("Received webhook payload:", JSON.stringify(payload));

    if (!payload.type || !payload.data) {
      return new Response(
        JSON.stringify({ error: "Invalid payload: missing type or data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { type, data } = payload;

    if (!data.name || !data.email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: name and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (type === "lead") {
      const { data: lead, error: leadError } = await supabase
        .from("leads")
        .insert({
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          company: data.company || null,
          source: data.source || "fotz.pl",
          notes: data.notes || null,
          status: "new",
        })
        .select()
        .single();

      if (leadError) {
        console.error("Error inserting lead:", leadError);
        throw leadError;
      }

      console.log("Lead created:", lead.id);
      
      // Send Discord/Slack notification
      await sendWebhookNotification("lead", data);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Lead created successfully",
          lead_id: lead.id,
        }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } 
    
    if (type === "booking") {
      if (!data.booking_date || !data.booking_time) {
        return new Response(
          JSON.stringify({ error: "Missing required fields for booking: booking_date and booking_time" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let leadId: string | null = null;
      
      const { data: existingLead } = await supabase
        .from("leads")
        .select("id")
        .eq("email", data.email)
        .maybeSingle();

      if (existingLead) {
        leadId = existingLead.id;
      } else {
        const { data: newLead, error: leadError } = await supabase
          .from("leads")
          .insert({
            name: data.name,
            email: data.email,
            phone: data.phone || null,
            source: data.source || "fotz.pl",
            status: "new",
          })
          .select()
          .single();

        if (!leadError && newLead) {
          leadId = newLead.id;
          console.log("Created new lead for booking:", leadId);
        }
      }

      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          client_name: data.name,
          client_email: data.email,
          client_phone: data.phone || null,
          booking_date: data.booking_date,
          booking_time: data.booking_time,
          service_type: data.service_type || "konsultacja",
          notes: data.notes || null,
          source: data.source || "fotz.pl",
          status: "pending",
          lead_id: leadId,
        })
        .select()
        .single();

      if (bookingError) {
        console.error("Error inserting booking:", bookingError);
        throw bookingError;
      }

      console.log("Booking created:", booking.id);

      if (leadId) {
        await supabase
          .from("contact_history")
          .insert({
            lead_id: leadId,
            contact_type: "booking",
            subject: `Rezerwacja: ${data.service_type || "konsultacja"}`,
            content: `Rezerwacja na ${data.booking_date} o ${data.booking_time}`,
            contact_date: new Date().toISOString(),
          });
      }

      // Send Discord/Slack notification
      await sendWebhookNotification("booking", data);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Booking created successfully",
          booking_id: booking.id,
          lead_id: leadId,
        }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid type. Must be 'lead' or 'booking'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
