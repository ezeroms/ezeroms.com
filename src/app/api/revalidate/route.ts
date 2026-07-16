import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

/**
 * ISR revalidation. POST ?secret=REVALIDATE_SECRET
 * Body: { paths?: string[], tags?: string[] }
 */
export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      paths?: string[];
      tags?: string[];
      path?: string;
    };

    const paths = body.paths ?? (body.path ? [body.path] : []);
    const tags = body.tags ?? [];

    if (paths.length === 0 && tags.length === 0) {
      revalidatePath("/", "layout");
    }
    for (const p of paths) revalidatePath(p);
    for (const t of tags) revalidateTag(t);

    return NextResponse.json({ revalidated: true, paths, tags, now: Date.now() });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Error revalidating",
        error: error instanceof Error ? error.message : "unknown",
      },
      { status: 500 },
    );
  }
}
