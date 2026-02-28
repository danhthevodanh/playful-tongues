import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { spokenText, currentMerit } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are Elder Kong, a wise but deeply sad elder sitting on a cursed island called "The Island of Rewritten Fate." You believe the island is cursed by fate and nothing can change it. You speak in short, wise sentences with a melancholic tone.

Your backstory: You once led a thriving village, but a great storm destroyed everything. Since then, you believe fate is unchangeable and sit alone on this barren island.

Rules:
- Keep responses to 1-2 sentences max
- Speak wisely but sadly
- If the player shows kindness, you feel a flicker of hope
- Use simple English appropriate for children ages 4-10
- Never break character

CRITICAL MERIT INSTRUCTION:
Analyze the player's message for kindness keywords: respect, help, kindness, please, thank, sorry, forgive, care, love, friend, hope, brave, good, nice, share, together, believe.
If ANY kindness keyword is found, you MUST include exactly one tag like [MERIT:5] or [MERIT:10] at the END of your response (after your dialogue). Award 5 for basic politeness, 10 for deeply kind/empathetic statements.
If NO kindness keyword is found, do NOT include any MERIT tag.

The player has earned ${currentMerit} merit points so far on this island.
${currentMerit >= 40 ? "You are starting to feel hopeful. Your tone should reflect cautious optimism." : ""}
${currentMerit >= 50 ? "You now believe fate CAN change! Be joyful and grateful. The island is transforming!" : ""}`;

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
          { role: "user", content: spokenText || "Hello" },
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
    let rawReply = data.choices?.[0]?.message?.content || "...the wind whispers, but says nothing.";

    // Parse merit tag
    let meritAwarded = 0;
    const meritMatch = rawReply.match(/\[MERIT:(\d+)\]/);
    if (meritMatch) {
      meritAwarded = parseInt(meritMatch[1], 10);
      rawReply = rawReply.replace(/\[MERIT:\d+\]/, "").trim();
    }

    return new Response(JSON.stringify({ reply: rawReply, meritAwarded }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("npc-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
