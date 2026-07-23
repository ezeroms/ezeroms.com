import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  AdminWorkListTable,
  type AdminWorkTableItem,
} from "@/components/admin/AdminWorkListTable";
import { WorkCreateButton } from "@/components/admin/WorkCreateButton";
import { WorksSectionSettingsModal } from "@/components/admin/WorksSectionSettingsModal";
import { Card, CardContent } from "@/components/ui/card";
import { htmlToEditableMarkdown } from "@/lib/admin/content";
import { loadWorksSection } from "@/lib/content/queries";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";
import { normalizeWorkRow } from "@/lib/content/work-filter";

export const dynamic = "force-dynamic";

function isChooningWork(row: Record<string, unknown>): boolean {
  return normalizeWorkRow(row).product_key === "chooning";
}

export default async function AdminChooningListPage() {
  await getSessionUser();
  const section = await loadWorksSection("chooning");

  let items: AdminWorkTableItem[] = [];
  let loadError: string | null = null;

  if (hasSupabaseConfig()) {
    let { data, error } = await getSupabaseAdmin()
      .from("work")
      .select(
        "slug, title, date, status, client, image_url, start_date, end_date, work_category, work_tag, work_kind, product_key, role, agency, body_html, og_image",
      )
      .eq("is_deleted", false)
      .order("date", { ascending: false })
      .limit(300);

    if (error) {
      const fallback = await getSupabaseAdmin()
        .from("work")
        .select(
          "slug, title, date, status, client, image_url, start_date, end_date, work_category, work_tag, role, agency, body_html",
        )
        .eq("is_deleted", false)
        .order("date", { ascending: false })
        .limit(300);
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      loadError = error.message;
      console.error("[admin/chooning]", error.message);
    } else {
      items = ((data ?? []) as Record<string, unknown>[])
        .filter(isChooningWork)
        .slice(0, 200)
        .map((row) => {
          const slug = String(row.slug ?? "");
          const title = String(row.title ?? "");
          const date = String(row.date ?? "");
          const status = String(row.status ?? "published");
          const client = (row.client as string | null) ?? null;
          const categories = (row.work_category as string[] | null) ?? [];
          const tags = (row.work_tag as string[] | null) ?? [];
          const bodyHtml = (row.body_html as string | null) ?? "";
          const startDate = row.start_date
            ? String(row.start_date).slice(0, 10)
            : "";
          const endDate = row.end_date ? String(row.end_date).slice(0, 10) : "";

          return {
            slug,
            title,
            date,
            client,
            status,
            editor: {
              slug,
              title,
              body_md: htmlToEditableMarkdown(bodyHtml),
              date,
              image_url: (row.image_url as string | null) ?? "",
              start_date: startDate,
              end_date: endDate,
              categories: categories.join(", "),
              tags: tags.join(", "),
              role: (row.role as string | null) ?? "",
              client: client ?? "",
              agency: (row.agency as string | null) ?? "",
              status: status === "draft" ? "draft" : "published",
              og_image: (row.og_image as string | null) ?? "",
              product_key: "chooning",
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
              metaApiPath="/api/admin/works/chooning/meta/"
              initialLabel={section.label}
              initialStatus={section.status}
            />
            <WorkCreateButton productKey="chooning" />
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
          <AdminWorkListTable items={items} empty={!items.length} />
        </CardContent>
      </Card>
    </AdminContent>
  );
}
