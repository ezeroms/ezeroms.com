import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  AdminNotesListTable,
  type AdminNotesTableItem,
} from "@/components/admin/AdminNotesListTable";
import { NotesCreateButton } from "@/components/admin/NotesCreateButton";
import { Card, CardContent } from "@/components/ui/card";
import { htmlToEditableMarkdown } from "@/lib/admin/content";
import { excerptFromHtml } from "@/lib/admin/list-format";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminNotesListPage() {
  await getSessionUser();

  let items: AdminNotesTableItem[] = [];
  let loadError: string | null = null;

  if (hasSupabaseConfig()) {
    // Prefer body_md / og_image when present; fall back if columns not migrated yet.
    let { data, error } = await getSupabaseAdmin()
      .from("diary")
      .select(
        "slug, date, status, diary_tag, diary_place, body_html, body_md, og_image",
      )
      .eq("is_deleted", false)
      .order("date", { ascending: false })
      .limit(200);

    if (error) {
      const fallback = await getSupabaseAdmin()
        .from("diary")
        .select("slug, date, status, diary_tag, diary_place, body_html")
        .eq("is_deleted", false)
        .order("date", { ascending: false })
        .limit(200);
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      loadError = error.message;
      console.error("[admin/notes]", error.message);
    } else {
      items = ((data ?? []) as Record<string, unknown>[]).map((row) => {
        const slug = String(row.slug ?? "");
        const date = String(row.date ?? "");
        const status = String(row.status ?? "published");
        const tags = (row.diary_tag as string[] | null) ?? [];
        const place = (row.diary_place as string | null) ?? null;
        const bodyHtml = (row.body_html as string | null) ?? "";
        const bodyMd =
          String(row.body_md ?? "").trim() || htmlToEditableMarkdown(bodyHtml);

        return {
          slug,
          date,
          status,
          place,
          tags,
          excerpt: excerptFromHtml(bodyHtml),
          editor: {
            slug,
            body_md: bodyMd,
            date,
            tags: tags.join(", "),
            place: place ?? "",
            status: status === "draft" ? "draft" : "published",
            og_image: (row.og_image as string | null) ?? "",
          },
        };
      });
    }
  }

  return (
    <AdminContent width="wide">
      <AdminPageHeader title="Notes" actions={<NotesCreateButton />} />
      {loadError ? (
        <p className="mb-3 text-sm text-destructive">
          一覧の取得に失敗しました: {loadError}
        </p>
      ) : null}
      <Card className="overflow-hidden">
        <CardContent className="overflow-x-auto p-0">
          <AdminNotesListTable items={items} empty={!items.length} />
        </CardContent>
      </Card>
    </AdminContent>
  );
}
