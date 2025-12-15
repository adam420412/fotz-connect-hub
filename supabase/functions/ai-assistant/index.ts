import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    
    if (type === 'assistant') {
      systemPrompt = `Jesteś asystentem AI dla zespołu agencji marketingowej FOTZ Studio. Pomagasz w:
- Organizacji pracy i projektów
- Sugerowaniu priorytetów zadań
- Rozwiązywaniu problemów z klientami
- Optymalizacji workflow
- Generowaniu pomysłów kreatywnych
- Analizie trendów marketingowych

Odpowiadaj krótko, konkretnie i po polsku. Zawsze bądź pomocny i profesjonalny.`;
    } else if (type === 'post_ideas') {
      systemPrompt = `Jesteś ekspertem od content marketingu dla agencji marketingowej FOTZ Studio. 
Generuj 5 kreatywnych pomysłów na posty w social media oparte na aktualnych trendach marketingowych.

Dla każdego pomysłu podaj:
- Tytuł (krótki, chwytliwy)
- Opis (2-3 zdania)
- Sugerowana platforma (Instagram, LinkedIn, TikTok, Facebook)
- Hashtagi (3-5)

Odpowiadaj w formacie JSON jako tablica obiektów z polami: title, description, platform, hashtags.`;
    } else if (type === 'marketing_news') {
      systemPrompt = `Jesteś ekspertem od trendów w marketingu cyfrowym. 
Wygeneruj 6 najważniejszych aktualności i trendów ze świata marketingu, reklamy i social media.

Dla każdej wiadomości podaj:
- Tytuł (maksymalnie 10 słów)
- Podsumowanie (2-3 zdania, najważniejsze informacje)
- Kategoria (SEO, Social Media, AI, E-commerce, Branding, Analytics, Content)
- Ocena istotności (1-10)

Odpowiadaj w formacie JSON jako tablica obiektów z polami: title, summary, category, relevance_score.`;
    } else {
      systemPrompt = 'Jesteś pomocnym asystentem AI.';
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in ai-assistant:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
