import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  AdminColumnListTable,
  type AdminColumnTableItem,
} from "@/components/admin/AdminColumnListTable";
import { ColumnCreateButton } from "@/components/admin/ColumnCreateButton";
import { WorksSectionSettingsModal } from "@/components/admin/WorksSectionSettingsModal";
import { Card, CardContent } from "@/components/ui/card";
import { htmlToEditableMarkdown } from "@/lib/admin/content";
import { loadWritingSection } from "@/lib/content/queries";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminColumnListPage() {
  await getSessionUser();
  const section = await loadWritingSection("column");

  let items: AdminColumnTableItem[] = [];
  let loadError: string | null = null;

  if (hasSupabaseConfig()) {
    let { data, error } = await getSupabaseAdmin()
      .from("column")
      .select(
        "slug, title, date, status, column_category, column_tag, body_html, og_image",
      )
      .eq("is_deleted", false)
      .order("date", { ascending: false })
      .limit(200);

    if (error) {
      const fallback = await getSupabaseAdmin()
        .from("column")
        .select(
          "slug, title, date, status, column_category, column_tag, body_html",
        )
        .eq("is_deleted", false)
        .order("date", { ascending: false })
        .limit(200);
      data = fallback.data as typeof data;
      error = fallback.error;
    }

    if (error) {
      loadError = error.message;
      console.error("[admin/column]", error.message);
    } else {
      items = ((data ?? []) as Record<string, unknown>[]).map((row) => {
        const slug = String(row.slug ?? "");
        const title = String(row.title ?? "");
        const date = String(row.date ?? "");
        const status = String(row.status ?? "published");
        const categories = (row.column_category as string[] | null) ?? [];
        const tags = (row.column_tag as string[] | null) ?? [];
        const bodyHtml = (row.body_html as string | null) ?? "";
        const bodyMd = htmlToEditableMarkdown(bodyHtml);

        return {
          slug,
          title,
          date,
          status,
          categories,
          editor: {
            slug,
            title,
            body_md: bodyMd,
            date,
            categories: categories.join(", "),
            tags: tags.join(", "),
            status: status === "draft" ? "draft" : "published",
            og_image: (row.og_image as string | null) ?? "",
          },
        };
      });
    }
  }

  return (
    <AdminContent width="wide">
      <AdminPageHeader
        title={section.label}
        actions={
          <div className="flex flex-wrap gap-2">
            <WorksSectionSettingsModal
              metaApiPath="/api/admin/writing/column/meta/"
              initialLabel={section.label}
              initialStatus={section.status}
              initialOgImage={section.og_image}
              ogUploadKind="column-section"
            />
            <ColumnCreateButton />
          </div>
        }
      />
      {loadError ? (
        <p className="mb-3 text-sm text-destructive">
          一覧の取得に失敗しました: {loadError}
        </p>
      ) : null}
      <Card className="overflow-hidden">
        <CardContent className="overflow-x-auto p-0">
          <AdminColumnListTable items={items} empty={!items.length} />
        </CardContent>
      </Card>
    </AdminContent>
  );
}
