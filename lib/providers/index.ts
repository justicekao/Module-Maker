import type { AiProviderId } from "@/types/graph";

export interface CompleteParams {
  apiKey: string;
  model: string;
  systemPrompt?: string;
  userPrompt: string;
}

export class ProviderError extends Error {}

async function completeOpenAi({
  apiKey,
  model,
  systemPrompt,
  userPrompt,
}: CompleteParams): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        { role: "user", content: userPrompt },
      ],
    }),
  });
  if (!res.ok) {
    throw new ProviderError(`OpenAI request failed: ${await res.text()}`);
  }
  const json = await res.json();
  const text = json.choices?.[0]?.message?.content;
  if (typeof text !== "string") {
    throw new ProviderError("OpenAI response did not contain text output.");
  }
  return text;
}

async function completeAnthropic({
  apiKey,
  model,
  systemPrompt,
  userPrompt,
}: CompleteParams): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!res.ok) {
    throw new ProviderError(`Anthropic request failed: ${await res.text()}`);
  }
  const json = await res.json();
  const text = json.content
    ?.filter((block: { type: string }) => block.type === "text")
    .map((block: { text: string }) => block.text)
    .join("");
  if (typeof text !== "string" || text.length === 0) {
    throw new ProviderError("Anthropic response did not contain text output.");
  }
  return text;
}

async function completeGoogle({
  apiKey,
  model,
  systemPrompt,
  userPrompt,
}: CompleteParams): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model,
    )}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        ...(systemPrompt
          ? { systemInstruction: { parts: [{ text: systemPrompt }] } }
          : {}),
      }),
    },
  );
  if (!res.ok) {
    throw new ProviderError(`Google request failed: ${await res.text()}`);
  }
  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text ?? "")
    .join("");
  if (typeof text !== "string" || text.length === 0) {
    throw new ProviderError("Google response did not contain text output.");
  }
  return text;
}

const ADAPTERS: Record<AiProviderId, (params: CompleteParams) => Promise<string>> = {
  OPENAI: completeOpenAi,
  ANTHROPIC: completeAnthropic,
  GOOGLE: completeGoogle,
};

export async function completeWithProvider(
  provider: AiProviderId,
  params: CompleteParams,
): Promise<string> {
  return ADAPTERS[provider](params);
}
