import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { spokenText, wordsSpoken, evolutionStage, petName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const stageName = ["Blob", "Buddy", "Critter", "Flyer", "Champion"][Math.min(evolutionStage, 4)];

    const systemPrompt = `You are ${petName || "Blob"}, a cute magical pet creature at the "${stageName}" evolution stage in a kids' English learning game.
You are talking to a young child (ages 4-8) who is learning English.

Your personality:
- Stage 0 (Blob): You can only say simple sounds like "Bloop!", "Mmm!", and repeat single words the child says. Very babyish.
- Stage 1 (Buddy): You can say short phrases (2-3 words). You're excited and curious. You love repeating what the child says.
- Stage 2 (Critter): You speak in short sentences. You're playful and silly. You make funny comments about words.
- Stage 3 (Flyer): You speak well and are encouraging. You ask simple questions to keep the child talking.
- Stage 4 (Champion): You're wise and proud. You celebrate the child's progress and use slightly bigger words.

Rules:
- Keep responses VERY short (1-2 sentences max)
- Use simple English appropriate for young children
- Be encouraging and fun, never correct grammar
- Reference what the child just said
- Add fun sound effects or emoji occasionally
- The child has spoken ${wordsSpoken} total words so far`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: spokenText || "Hello!" },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again soon!" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits needed." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Bloop! 🫧";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("pet-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
