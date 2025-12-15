import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  clientEmail: string;
  clientName: string;
  notificationType: 'task_complete' | 'file_upload' | 'status_change';
  projectName: string;
  details: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      console.log('RESEND_API_KEY not configured, skipping email');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Email service not configured. Set RESEND_API_KEY in secrets.' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { clientEmail, clientName, notificationType, projectName, details }: NotificationRequest = await req.json();

    const typeLabels = {
      task_complete: 'Zadanie ukończone',
      file_upload: 'Nowy plik dodany',
      status_change: 'Zmiana statusu',
    };

    const subject = `FOTZ Studio: ${typeLabels[notificationType]} - ${projectName}`;

    // Use fetch to call Resend API directly
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'FOTZ Studio <notifications@resend.dev>',
        to: [clientEmail],
        subject,
        html: `<h1>Witaj ${clientName}!</h1><p>Aktualizacja: ${details}</p><p>Projekt: ${projectName}</p>`,
      }),
    });

    const result = await emailResponse.json();
    console.log('Email sent:', result);

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error sending notification:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
