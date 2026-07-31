import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAdmin } from "@/lib/workspace/api-auth";
import { hasWorkspaceAiConfig } from "@/lib/workspace/assistant/config";
import { proposeDailyPlan } from "@/lib/workspace/assistant/propose";

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  if (!hasWorkspaceAiConfig()) {
    return NextResponse.json(
      {
        error: "AI is not configured",
        code: "AI_NOT_CONFIGURED",
      },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      question?: string;
    };
    const question = (body.question ?? "").trim();
    if (question.length > 2000) {
      return NextResponse.json(
        { error: "question is too long" },
        { status: 400 },
      );
    }

    const answer = await proposeDailyPlan(question);
    // Propose-only: never mutate tasks/calendar/docs here.
    return NextResponse.json({
      answer,
      mode: "propose_only",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI request failed" },
      { status: 500 },
    );
  }
}
