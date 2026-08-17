import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  AdminGiantsListTable,
  type AdminGiantsTableItem,
} from "@/components/admin/AdminGiantsListTable";
import { GiantsCreateButton } from "@/components/admin/GiantsCreateButton";
import { WorksSectionSettingsModal } from "@/components/admin/WorksSectionSettingsModal";
import { Card, CardContent } from "@/components/ui/card";
import { htmlToEditableMarkdown } from "@/lib/admin/content";
import {
  formatGiantsCitation,
  giantsExcerpt,
} from "@/lib/content/giants-meta";
import { loadLibrarySection } from "@/lib/content/queries";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminGiantsPage() {
  await getSessionUser();
  const section = await loadLibrarySection("giants");

  let items: AdminGiantsTableItem[] = [];
  let loadError: string | null = null;

  if (hasSupabaseConfig()) {
    const { data, error } = await getSupabaseAdmin()
      .from("shoulders_of_giants")
      .select(
        "slug, topic, book_title, author, publisher, published_year, citation_override, source_url, body_html, og_image, status, published_at, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      loadError = error.message;
      console.error("[admin/giants]", error.message);
    } else {
      items = ((data ?? []) as Record<string, unknown>[]).map((row) => {
        const slug = String(row.slug ?? "");
        const status = String(row.status ?? "draft");
        const topics = (row.topic as string[] | null) ?? [];
        const bodyHtml = String(row.body_html ?? "");
        const sourceUrl = String(row.source_url ?? "");
        const citationItem = {
          book_title: (row.book_title as string | null) ?? null,
          author: (row.author as string | null) ?? null,
          publisher: (row.publisher as string | null) ?? null,
          published_year: (row.published_year as string | null) ?? null,
          citation_override: (row.citation_override as string | null) ?? null,
        };

        return {
          slug,
          excerpt: giantsExcerpt(bodyHtml, 120),
          citation: formatGiantsCitation(citationItem),
          source_url: sourceUrl,
          status,
          topics,
          editor: {
            slug,
            body_md: htmlToEditableMarkdown(bodyHtml),
            topics: topics.join(", "),
            book_title: String(row.book_title ?? ""),
            author: String(row.author ?? ""),
            publisher: String(row.publisher ?? ""),
            published_year: String(row.published_year ?? ""),
            citation_override: String(row.citation_override ?? ""),
            source_url: sourceUrl,
            og_image: String(row.og_image ?? ""),
            status: status === "draft" ? "draft" : "published",
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
              metaApiPath="/api/admin/library/giants/meta/"
              initialLabel={section.label}
              initialStatus={section.status}
              initialOgImage={section.og_image}
            />
            <GiantsCreateButton />
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
          <AdminGiantsListTable items={items} empty={!items.length} />
        </CardContent>
      </Card>
    </AdminContent>
  );
}
