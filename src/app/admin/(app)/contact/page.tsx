import {
  AboutContactEditor,
  type AboutContactEditorInitial,
} from "@/components/admin/AboutContactEditor";
import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { htmlToEditableMarkdown } from "@/lib/admin/content";
import { ABOUT_CONTACT_CONTENT_SLUG } from "@/lib/content/about-routes";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SELECT_FULL =
  "id, title, body_md, body_html, og_image, status";
const SELECT_WITHOUT_OG = "id, title, body_md, body_html, status";

export default async function AdminContactPage() {
  await getSessionUser();

  let loadError: string | null = null;
  let loadWarn: string | null = null;
  let initial: AboutContactEditorInitial | null = null;

  if (!hasSupabaseConfig()) {
    loadError = "Supabase が設定されていません";
  } else {
    let { data, error } = await getSupabaseAdmin()
      .from("about")
      .select(SELECT_FULL)
      .eq("slug", ABOUT_CONTACT_CONTENT_SLUG)
      .maybeSingle();

    if (error && /og_image/i.test(error.message)) {
      const fallback = await getSupabaseAdmin()
        .from("about")
        .select(SELECT_WITHOUT_OG)
        .eq("slug", ABOUT_CONTACT_CONTENT_SLUG)
        .maybeSingle();
      data = fallback.data as typeof data;
      error = fallback.error;
      if (!error) {
        loadWarn =
          "about.og_image が未作成です。supabase/migrations/20260720150000_about_og_image.sql または 20260717140000_content_og_image.sql を適用してください。";
      }
    }

    if (error) {
      loadError = /body_md/i.test(error.message)
        ? "about.body_md が未作成です。supabase/migrations/20260720140000_about_here_body_md.sql を適用してください。"
        : error.message;
    } else if (data) {
      const row = data as Record<string, unknown>;
      const bodyMarkdown =
        String(row.body_md ?? "").trim() ||
        htmlToEditableMarkdown(String(row.body_html ?? ""));
      initial = {
        id: String(row.id),
        title: String(row.title ?? "Contact"),
        body_md: bodyMarkdown,
        og_image: String(row.og_image ?? ""),
        status: row.status === "draft" ? "draft" : "published",
      };
    }
  }

  return (
    <AdminContent>
      <AdminPageHeader
        title="Contact"
        description="お問い合わせページ（公開: /about/contact/）"
      />
      {loadError ? (
        <Alert variant="destructive" className="mb-4">
          {loadError}
        </Alert>
      ) : null}
      {loadWarn ? <Alert className="mb-4">{loadWarn}</Alert> : null}
      <Card>
        <CardHeader>
          <CardTitle>記事を編集</CardTitle>
        </CardHeader>
        <CardContent>
          <AboutContactEditor initial={initial} />
        </CardContent>
      </Card>
    </AdminContent>
  );
}
