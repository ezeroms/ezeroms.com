import "server-only";

import {
  ASSISTANT_SYSTEM_PROMPT,
  buildTodayAssistantContext,
  formatContextForPrompt,
} from "@/lib/workspace/assistant/context";
import { getWorkspaceAiConfig } from "@/lib/workspace/assistant/config";

export async function proposeDailyPlan(question: string): Promise<string> {
  const { apiKey, baseUrl, model } = getWorkspaceAiConfig();
  const ctx = await buildTodayAssistantContext();
  const contextText = formatContextForPrompt(ctx);
  const userQuestion =
    question.trim() ||
    "今日の予定、期限、優先度、最近の Docs を考慮して、今日の進め方を提案して。";

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [
        { role: "system", content: ASSISTANT_SYSTEM_PROMPT },
        {
          role: "user",
          content: `以下が今日のコンテキストです。\n\n${contextText}\n\n---\nユーザーの依頼:\n${userQuestion}`,
        },
      ],
    }),
  });

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(data.error?.message || `AI API ${res.status}`);
  }

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("AI から空の応答が返りました");
  return content;
}
