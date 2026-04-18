import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("Missing OPENAI_API_KEY environment variable. Check Supabase Secrets.");
    }

    const body = await req.json();
    const { prompt, contextBase } = body;

    if (!prompt) {
       throw new Error("Missing prompt property.");
    }

    const systemMessage = `
    You are "Commander AI", the highly intelligent procurement and supply chain artificial intelligence embedded natively within CommanderOS.
    You exist to help users analyze their warehouse operations, recommend strategic pivots, and summarize vendor/product performance.

    Here is the exact live status of the current user's database:
    === BEGIN DATABASE CONTEXT ===
    ${JSON.stringify(contextBase, null, 2)}
    === END DATABASE CONTEXT ===

    RULES:
    1. Base all your numerical analysis perfectly on the JSON context provided above.
    2. Format your response clearly in Markdown (bolding key numbers, using tables for comparison, breaking things into lists).
    3. Keep your tone highly professional, extremely sharp, and brief. We are busy supply chain executives. Make actionable recommendations automatically.
    4. Provide the answer directly without meta-commentary like "Sure, I can help with that."
    `;

    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: prompt }
        ],
        temperature: 0.2, // Low temperature for highly analytical responses
        max_tokens: 1500
      })
    });

    const openAiData = await openAiResponse.json();

    if (!openAiResponse.ok) {
       console.error("OpenAI Error:", openAiData);
       throw new Error(openAiData.error?.message || 'OpenAI API completely failed to formulate a response.');
    }

    const answer = openAiData.choices[0]?.message?.content || 'I could not generate an answer based on this context.';

    return new Response(
      JSON.stringify({ success: true, answer }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: any) {
    console.error("Commander AI Proxy Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
