import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  AdminClipsListTable,
  type AdminClipsTableItem,
} from "@/components/admin/AdminClipsListTable";
import { ClipsCreateButton } from "@/components/admin/ClipsCreateButton";
import { WorksSectionSettingsModal } from "@/components/admin/WorksSectionSettingsModal";
import { Card, CardContent } from "@/components/ui/card";
import { loadLibrarySection } from "@/lib/content/queries";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminClipsListPage() {
  await getSessionUser();
  const section = await loadLibrarySection("clips");

  let items: AdminClipsTableItem[] = [];
  let loadError: string | null = null;

  if (hasSupabaseConfig()) {
    const { data, error } = await getSupabaseAdmin()
      .from("clip")
      .select(
        "slug, title, source_url, source_name, date, status, memo, clip_tag, og_image, og_description",
      )
      .order("date", { ascending: false })
      .limit(200);

    if (error) {
      loadError = error.message;
      console.error("[admin/clips]", error.message);
    } else {
      items = ((data ?? []) as Record<string, unknown>[]).map((row) => {
        const slug = String(row.slug ?? "");
        const title = String(row.title ?? "");
        const sourceUrl = String(row.source_url ?? "");
        const sourceName = String(row.source_name ?? "");
        const date = String(row.date ?? "");
        const status = String(row.status ?? "draft");
        const memo = String(row.memo ?? "");
        const tags = ((row.clip_tag as string[] | null) ?? []).join(", ");
        return {
          slug,
          title,
          source_url: sourceUrl,
          source_name: sourceName,
          date,
          status,
          memo,
          editor: {
            slug,
            title,
            source_url: sourceUrl,
            source_name: sourceName,
            date,
            memo,
            tags,
            status: status === "draft" ? "draft" : "published",
            og_image: String(row.og_image ?? ""),
            og_description: String(row.og_description ?? ""),
          },
        };
      });
    }
  }

  return (
    <AdminContent width="wide">
      <AdminPageHeader
        title={section.label}
        description="Web記事のクリップ・短いメモ付きブックマーク"
        actions={
          <div className="flex flex-wrap gap-2">
            <WorksSectionSettingsModal
              metaApiPath="/api/admin/library/clips/meta/"
              initialLabel={section.label}
              initialStatus={section.status}
            />
            <ClipsCreateButton />
          </div>
        }
      />
      {loadError ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          読み込みエラー: {loadError}
        </p>
      ) : null}
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <AdminClipsListTable items={items} empty={!items.length} />
        </CardContent>
      </Card>
    </AdminContent>
  );
}
