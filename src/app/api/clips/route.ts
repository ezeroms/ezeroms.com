import { NextResponse } from "next/server";
import { listClip } from "@/lib/content/queries";
import { jsonError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { items, total } = await listClip();
    return NextResponse.json({ items, total });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to list clips");
  }
}
