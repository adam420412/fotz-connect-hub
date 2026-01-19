import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const testUsers = [
  {
    email: "manager@fotz.pl",
    password: "Test123!",
    role: "manager",
    full_name: "Manager Testowy",
  },
  {
    email: "employee@fotz.pl", 
    password: "Test123!",
    role: "employee",
    full_name: "Pracownik Testowy",
  },
  {
    email: "client@fotz.pl",
    password: "Test123!",
    role: "client",
    full_name: "Klient Testowy",
    company_name: "Firma Testowa Sp. z o.o.",
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const results: { email: string; status: string; error?: string }[] = [];

    for (const user of testUsers) {
      try {
        // Create user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            full_name: user.full_name,
          },
        });

        if (authError) {
          if (authError.message.includes("already been registered")) {
            results.push({ email: user.email, status: "already_exists" });
            continue;
          }
          throw authError;
        }

        const userId = authData.user.id;

        // Update profile with company name if client
        if (user.company_name) {
          await supabaseAdmin
            .from("profiles")
            .update({ company_name: user.company_name })
            .eq("id", userId);
        }

        // Set role
        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .update({ role: user.role })
          .eq("user_id", userId);

        if (roleError) {
          await supabaseAdmin
            .from("user_roles")
            .insert({ user_id: userId, role: user.role });
        }

        results.push({ email: user.email, status: "created" });
      } catch (userError: unknown) {
        const message = userError instanceof Error ? userError.message : "Unknown error";
        results.push({ email: user.email, status: "error", error: message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Konta testowe przetworzone",
        results,
        credentials: testUsers.map(u => ({
          email: u.email,
          password: u.password,
          role: u.role,
        })),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error creating test users:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
