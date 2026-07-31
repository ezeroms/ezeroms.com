import "server-only";

export function hasWorkspaceAiConfig(): boolean {
  return Boolean(process.env.WORKSPACE_AI_API_KEY?.trim());
}

export function getWorkspaceAiConfig() {
  const apiKey = process.env.WORKSPACE_AI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Missing WORKSPACE_AI_API_KEY");
  }
  return {
    apiKey,
    baseUrl: (
      process.env.WORKSPACE_AI_BASE_URL?.trim() ||
      "https://api.openai.com/v1"
    ).replace(/\/$/, ""),
    model: process.env.WORKSPACE_AI_MODEL?.trim() || "gpt-4o-mini",
  };
}
