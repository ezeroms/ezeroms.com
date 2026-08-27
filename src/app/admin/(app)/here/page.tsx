import {
  AboutHereEditor,
  type AboutHereEditorInitial,
} from "@/components/admin/AboutHereEditor";
import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Alert } from "@/components/ui/alert";
import { htmlToEditableMarkdown } from "@/lib/admin/content";
import { ABOUT_HERE_CONTENT_SLUG } from "@/lib/content/about-routes";
import { parseAboutHereMarkdown } from "@/lib/content/about-here";
import { requireAdminPage } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SELECT_FULL =
  "id, title, body_md, body_html, intro_md, intro_html, rights_md, rights_html, updates_md, updates_html, og_image, status";
const SELECT_WITHOUT_SECTIONS =
  "id, title, body_md, body_html, og_image, status";
const SELECT_WITHOUT_OG = "id, title, body_md, body_html, status";

function initialFromRow(row: Record<string, unknown>): AboutHereEditorInitial {
  const bodyMarkdown =
    String(row.body_md ?? "").trim() ||
    htmlToEditableMarkdown(String(row.body_html ?? ""));
  const parsed = parseAboutHereMarkdown(bodyMarkdown);

  const introMd =
    String(row.intro_md ?? "").trim() ||
    htmlToEditableMarkdown(String(row.intro_html ?? "")).trim() ||
    parsed.intro_md;
  const rightsMd =
    String(row.rights_md ?? "").trim() ||
    htmlToEditableMarkdown(String(row.rights_html ?? "")).trim() ||
    parsed.rights_md;
  const updatesMd =
    String(row.updates_md ?? "").trim() ||
    htmlToEditableMarkdown(String(row.updates_html ?? "")).trim() ||
    parsed.updates_md;

  return {
    id: String(row.id),
    title: String(row.title ?? "このサイトについて"),
    intro_md: introMd,
    rights_md: rightsMd,
    updates_md: updatesMd,
    og_image: String(row.og_image ?? ""),
    status: row.status === "draft" ? "draft" : "published",
  };
}

export default async function AdminHerePage() {
  await requireAdminPage();

  let loadError: string | null = null;
  let loadWarn: string | null = null;
  let initial: AboutHereEditorInitial | null = null;

  if (!hasSupabaseConfig()) {
    loadError = "Supabase が設定されていません";
  } else {
    let { data, error } = await getSupabaseAdmin()
      .from("about")
      .select(SELECT_FULL)
      .eq("slug", ABOUT_HERE_CONTENT_SLUG)
      .maybeSingle();

    if (error && /intro_md|rights_md|updates_md/i.test(error.message)) {
      const fallback = await getSupabaseAdmin()
        .from("about")
        .select(SELECT_WITHOUT_SECTIONS)
        .eq("slug", ABOUT_HERE_CONTENT_SLUG)
        .maybeSingle();
      data = fallback.data as typeof data;
      error = fallback.error;
      if (!error) {
        loadWarn =
          "about の Here 3欄カラムが未作成です。supabase/migrations/20260826093000_about_here_sections.sql を適用してください。";
      }
    }

    if (error && /og_image/i.test(error.message)) {
      const fallback = await getSupabaseAdmin()
        .from("about")
        .select(SELECT_WITHOUT_OG)
        .eq("slug", ABOUT_HERE_CONTENT_SLUG)
        .maybeSingle();
      data = fallback.data as typeof data;
      error = fallback.error;
      if (!error) {
        loadWarn =
          "about.og_image が未作成です。supabase/migrations/20260720150000_about_og_image.sql を適用してください（本文の編集は可能です）。";
      }
    }

    if (error) {
      loadError = /body_md/i.test(error.message)
        ? "about.body_md が未作成です。supabase/migrations/20260720140000_about_here_body_md.sql を適用してください。"
        : error.message;
    } else if (data) {
      initial = initialFromRow(data as Record<string, unknown>);
    }
  }

  return (
    <AdminContent>
      <AdminPageHeader
        title="Here"
        description="このサイトについて（公開: /about/here/）"
      />
      {loadError ? (
        <Alert variant="destructive" className="mb-4">
          {loadError}
        </Alert>
      ) : null}
      {loadWarn ? <Alert className="mb-4">{loadWarn}</Alert> : null}
      <AboutHereEditor initial={initial} />
    </AdminContent>
  );
}
