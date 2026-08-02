import {
  AboutHereEditor,
  type AboutHereEditorInitial,
} from "@/components/admin/AboutHereEditor";
import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { htmlToEditableMarkdown } from "@/lib/admin/content";
import { ABOUT_HERE_CONTENT_SLUG } from "@/lib/content/about-routes";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SELECT_FULL =
  "id, title, body_md, body_html, og_image, status";
const SELECT_WITHOUT_OG = "id, title, body_md, body_html, status";

export default async function AdminHerePage() {
  await getSessionUser();

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

    // og_image 未マイグレーション時は SELECT 全体が落ちるためフォールバック
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
      const row = data as Record<string, unknown>;
      // body_md が空のレガシー行は HTML から編集用 Markdown を起こす
      const bodyMarkdown =
        String(row.body_md ?? "").trim() ||
        htmlToEditableMarkdown(String(row.body_html ?? ""));
      initial = {
        id: String(row.id),
        title: String(row.title ?? "このサイトについて"),
        body_md: bodyMarkdown,
        og_image: String(row.og_image ?? ""),
        status: row.status === "draft" ? "draft" : "published",
      };
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
      <Card>
        <CardHeader>
          <CardTitle>記事を編集</CardTitle>
        </CardHeader>
        <CardContent>
          <AboutHereEditor initial={initial} />
        </CardContent>
      </Card>
    </AdminContent>
  );
}
