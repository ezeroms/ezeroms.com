import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  htmlToEditableMarkdown,
  markdownToHtml,
} from "@/lib/admin/content";
import { parseExperienceProjects } from "@/lib/content/experience-meta";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ slug: string }> };

function parseOptionalDate(raw: string | undefined | null): string | null {
  const v = (raw ?? "").trim();
  if (!v) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  return v;
}

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!hasSupabaseConfig()) {
    return {
      error: NextResponse.json({ error: "Supabase not configured" }, { status: 500 }),
    };
  }
  return { user };
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { slug } = await params;
  const { data, error } = await getSupabaseAdmin()
    .from("experience")
    .select("*")
    .eq("slug", slug)
    .eq("is_deleted", false)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    item: {
      ...data,
      body_md: htmlToEditableMarkdown((data.body_html as string) ?? ""),
      projects_json: JSON.stringify(data.projects ?? [], null, 2),
      start_date: data.start_date
        ? String(data.start_date).slice(0, 10)
        : "",
      end_date: data.end_date ? String(data.end_date).slice(0, 10) : "",
    },
  });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { slug } = await params;

  try {
    const body = (await request.json()) as {
      organization?: string;
      title?: string;
      employment_type?: string;
      role?: string;
      start_date?: string;
      end_date?: string;
      business?: string;
      employee_count?: string;
      capital?: string;
      note?: string;
      summary?: string;
      body_md?: string;
      projects_json?: string;
      sort_order?: number | string;
      og_image?: string;
      status?: "draft" | "published" | "archived";
    };

    const organization = (body.organization ?? "").trim();
    if (!organization) {
      return NextResponse.json(
        { error: "組織名を入力してください" },
        { status: 400 },
      );
    }

    const startDate = parseOptionalDate(body.start_date);
    if (!startDate) {
      return NextResponse.json(
        { error: "開始日を入力してください" },
        { status: 400 },
      );
    }
    const endDate = parseOptionalDate(body.end_date);
    if (body.end_date?.trim() && !endDate) {
      return NextResponse.json({ error: "終了日が不正です" }, { status: 400 });
    }

    let projects: unknown[] = [];
    try {
      const raw = (body.projects_json ?? "").trim();
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        projects = parseExperienceProjects(parsed);
      }
    } catch {
      return NextResponse.json(
        { error: "プロジェクト JSON が不正です" },
        { status: 400 },
      );
    }

    const status =
      body.status === "draft"
        ? "draft"
        : body.status === "archived"
          ? "archived"
          : "published";
    const title = (body.title ?? "").trim();
    const employmentType = (body.employment_type ?? "").trim() || null;
    const role = (body.role ?? "").trim() || null;
    const business = (body.business ?? "").trim() || null;
    const employeeCount = (body.employee_count ?? "").trim() || null;
    const capital = (body.capital ?? "").trim() || null;
    const note = (body.note ?? "").trim() || null;
    const summary = (body.summary ?? "").trim();
    const bodyMd = (body.body_md ?? "").trim();
    const bodyHtml = markdownToHtml(bodyMd);
    const ogImage = (body.og_image ?? "").trim();
    const sortOrder = Number(body.sort_order);
    const now = new Date().toISOString();

    const { data: existing, error: findError } = await getSupabaseAdmin()
      .from("experience")
      .select("slug")
      .eq("slug", slug)
      .eq("is_deleted", false)
      .maybeSingle();

    if (findError) {
      return NextResponse.json({ error: findError.message }, { status: 500 });
    }
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const row = {
      organization,
      employment_type: employmentType,
      title,
      role,
      start_date: startDate,
      end_date: endDate,
      business,
      employee_count: employeeCount,
      capital,
      note,
      summary,
      body_html: bodyHtml,
      projects,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
      og_image: ogImage,
      status,
      published_at: status === "published" ? now : null,
      updated_at: now,
    };

    const { data, error } = await getSupabaseAdmin()
      .from("experience")
      .update(row)
      .eq("slug", slug)
      .select("id, slug, organization, title, status")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath("/works/experience");
    return NextResponse.json({ ok: true, item: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { slug } = await params;
  const { data, error } = await getSupabaseAdmin()
    .from("experience")
    .update({ is_deleted: true })
    .eq("slug", slug)
    .eq("is_deleted", false)
    .select("slug")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  revalidatePath("/works/experience");
  return NextResponse.json({ ok: true, slug });
}
