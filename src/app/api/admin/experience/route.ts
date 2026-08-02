import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  generateContentSlug,
  markdownToHtml,
} from "@/lib/admin/content";
import { parseExperienceProjects } from "@/lib/content/experience-meta";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

function parseOptionalDate(raw: string | undefined | null): string | null {
  const v = (raw ?? "").trim();
  if (!v) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  return v;
}

function revalidateExperiencePaths() {
  revalidatePath("/works/experience");
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("experience")
    .select(
      "id, slug, organization, title, start_date, end_date, status, sort_order, updated_at",
    )
    .eq("is_deleted", false)
    .order("start_date", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

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
      slug?: string;
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

    const status = body.status === "draft" ? "draft" : "published";
    const slug =
      (body.slug?.trim() && /^[a-z0-9-]+$/i.test(body.slug.trim())
        ? body.slug.trim()
        : null) || generateContentSlug();
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

    const row = {
      slug,
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
      is_deleted: false,
    };

    const { data, error } = await getSupabaseAdmin()
      .from("experience")
      .insert(row)
      .select("id, slug, organization, title, status")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidateExperiencePaths();
    return NextResponse.json({ ok: true, item: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Create failed" },
      { status: 500 },
    );
  }
}
