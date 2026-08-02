"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const DEFAULT_QUESTION =
  "今日の予定、期限、優先度、最近の Docs を考慮して、今日の進め方を提案して。";

type Props = {
  configured: boolean;
};

export function WorkspaceAssistantPanel({ configured }: Props) {
  const [question, setQuestion] = useState(DEFAULT_QUESTION);
  const [answer, setAnswer] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy || !configured) return;
    setBusy(true);
    setError(null);
    setAnswer(null);
    try {
      const res = await fetch("/api/admin/workspace/assistant/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = (await res.json()) as {
        answer?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "相談に失敗しました");
      setAnswer(data.answer ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "相談に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  if (!configured) {
    return (
      <div className="rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
        AI 相談は未設定です。.env.local に{" "}
        <code className="text-xs">WORKSPACE_AI_API_KEY</code>{" "}
        を設定してください（ENV_SETUP.md）。未設定でも他のカードは使えます。
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <p className="m-0 mb-3 text-xs text-muted-foreground">
        提案のみです。Tasks / カレンダーは自動では変更しません。
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="min-h-[88px]"
          disabled={busy}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy || !question.trim()}>
            {busy ? "考え中…" : "今日の進め方を相談"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => setQuestion(DEFAULT_QUESTION)}
          >
            定型に戻す
          </Button>
        </div>
      </form>
      {error ? (
        <p className="mt-3 m-0 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {answer ? (
        <div className="mt-4 whitespace-pre-wrap border-t border-border pt-4 text-sm leading-relaxed">
          {answer}
        </div>
      ) : null}
    </div>
  );
}
