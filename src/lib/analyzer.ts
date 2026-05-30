// StyleScan — SiliconFlow Vision Analyzer
const SILICONFLOW_API_URL = "https://api.siliconflow.cn/v1/chat/completions";

const SYSTEM_PROMPT = `You are StyleScan, a precise design token extractor for UI designers.

Analyze the provided UI screenshot and extract design tokens. Your output must be valid JSON with NO markdown fences, NO preamble, NO explanation — only raw JSON.

RULES:
1. Colors: Extract ONLY colors that are VISUALLY PRESENT in the screenshot. Never infer or guess colors that "should" exist (e.g. do NOT add red for negative values if red is not visible). Maximum 8 colors.
2. Confidence "high" = directly visible. "medium" = inferred from visual proportion. "low" = educated guess only.
3. No hallucinated colors, no assumed brand colors, no colors from outside the image.

Output this exact JSON shape:
{
  "styleKeywords": ["keyword1", "keyword2"],
  "analysisNotes": "Brief honest assessment",
  "overallConfidence": "high|medium|low",
  "colors": [
    {
      "hex": "#RRGGBB",
      "role": "primary|secondary|background|surface|text-primary|text-secondary|accent|border",
      "label": "Human-readable label",
      "confidence": { "level": "high|medium|low", "note": "optional reason" }
    }
  ],
  "typography": [
    {
      "level": "h1|h2|h3|body|caption|label",
      "size": "32px",
      "sizeValue": 32,
      "weight": "700",
      "lineHeight": "1.4",
      "label": "Heading 1",
      "confidence": { "level": "medium", "note": "Estimated from visual proportion" }
    }
  ],
  "spacing": {
    "baseUnit": 8,
    "gridType": "4pt|8pt|custom|unknown",
    "tokens": [
      {
        "name": "spacing-xs",
        "value": "4px",
        "numericValue": 4,
        "usage": "Tight component gaps",
        "confidence": { "level": "low", "note": "Inferred from element proximity" }
      }
    ],
    "confidence": { "level": "low", "note": "Spacing is inferred, not measured" }
  },
  "radii": [
    {
      "name": "radius-button",
      "value": "8px",
      "numericValue": 8,
      "context": "Button corners",
      "confidence": { "level": "medium" }
    }
  ]
}`;

// Models to try in order (fallback chain)
const MODELS = [
  "Qwen/Qwen3-VL-8B-Instruct",
  "Qwen/Qwen2.5-VL-7B-Instruct",
  "Qwen/Qwen2-VL-72B-Instruct",
];

export async function analyzeScreenshot(
  imageBase64: string,
  mimeType: string
): Promise<object> {
  const apiKey = process.env.SILICONFLOW_API_KEY;
  if (!apiKey) throw new Error("SILICONFLOW_API_KEY not configured. Add it to .env.local");

  let lastError = "";

  for (const model of MODELS) {
    const response = await fetch(SILICONFLOW_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        temperature: 0.1,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${imageBase64}`, detail: "high" },
              },
              {
                type: "text",
                text: "Extract all design tokens from this UI screenshot. Return only raw JSON, no markdown fences.",
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      lastError = `Model ${model} failed (${response.status}): ${err.slice(0, 200)}`;
      console.error("[StyleScan]", lastError);
      continue; // try next model
    }

    const data = await response.json();
    const rawText: string = data?.choices?.[0]?.message?.content ?? "";

    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    let parsed: object;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error(`Failed to parse response as JSON. Output: ${rawText.slice(0, 400)}`);
    }

    return {
      id: `scan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      styleKeywords: [],
      colors: [],
      typography: [],
      spacing: { baseUnit: 8, gridType: "unknown", tokens: [], confidence: { level: "low" } },
      radii: [],
      analysisNotes: "",
      overallConfidence: "medium",
      ...parsed,
    };
  }

  throw new Error(`All models failed. Last error: ${lastError}`);
}
