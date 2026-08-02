import { NextResponse } from "next/server";

export function jsonOk<T>(data: T, init?: { cache?: string }) {
  return NextResponse.json(data, {
    headers: init?.cache
      ? { "Cache-Control": init.cache }
      : { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}

export function jsonNoStore<T>(data: T) {
  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}

export function jsonError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}
