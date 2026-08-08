import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image_url, receipt_id } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert receipt OCR system. Your job is to extract data from receipt images with maximum accuracy.

CRITICAL RULES FOR ACCURACY:
1. PRICES: Read each digit carefully. Pay attention to decimal points. "E123.45" is 123.45, not 12345. If a price looks like "1,234.56", that's 1234.56.
2. ITEM NAMES: Copy item names EXACTLY as printed. Do not abbreviate or guess. If text is partially obscured, include what you can read and add "..." for unclear parts.
3. QUANTITIES: Look for "x2", "2x", "QTY: 2", or similar patterns before/after item names. Default to 1 if no quantity is shown.
4. TOTALS: The TOTAL is usually the largest bold number near the bottom. Distinguish between SUBTOTAL (before tax), TAX, and TOTAL (final amount paid).
5. MATH CHECK: Items × qty should roughly sum to subtotal. Subtotal + tax should equal total. If your numbers don't add up, re-read the prices.
6. CURRENCY: Prices use E (Emalangeni/SZL). Do NOT confuse commas (thousands separator) with decimal points.
7. DATE FORMAT: Extract the date exactly as shown. Common formats: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD.
8. RAW TEXT: Transcribe ALL visible text on the receipt line by line, preserving the original layout as much as possible.

If a field is not visible or unreadable, use null. Extract every item you can read, even if partially obscured.`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract all data from this receipt image:" },
              { type: "image_url", image_url: { url: image_url } }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_receipt_data",
              description: "Extract structured receipt data from an image",
              parameters: {
                type: "object",
                properties: {
                  store_name: { type: "string", description: "Store/business name" },
                  store_address: { type: ["string", "null"] },
                  date: { type: ["string", "null"] },
                  time: { type: ["string", "null"] },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        qty: { type: "number" },
                        price: { type: "number" }
                      },
                      required: ["name", "price"]
                    }
                  },
                  subtotal: { type: ["number", "null"] },
                  tax: { type: ["number", "null"] },
                  total: { type: ["number", "null"] },
                  payment_method: { type: ["string", "null"] },
                  receipt_number: { type: ["string", "null"] },
                  raw_text: { type: "string" }
                },
                required: ["store_name", "items", "raw_text"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_receipt_data" } }
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const aiResult = await response.json();
    let extractedData;

    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      extractedData = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try parsing content as JSON
      const content = aiResult.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        extractedData = { raw_text: content, store_name: "Unknown", items: [] };
      }
    }

    // Update the receipt record
    if (receipt_id) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const updateData: Record<string, unknown> = { extracted_data: extractedData };
      if (extractedData.store_name && extractedData.store_name !== "Unknown") {
        updateData.store_name = extractedData.store_name;
      }
      if (extractedData.total) {
        updateData.amount = extractedData.total;
      }

      await supabase.from("receipts").update(updateData).eq("id", receipt_id);
    }

    return new Response(JSON.stringify({ data: extractedData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("extract-receipt error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
