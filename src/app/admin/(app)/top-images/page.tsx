import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  AdminTopImageListTable,
  type AdminTopImageTableItem,
} from "@/components/admin/AdminTopImageListTable";
import { TopImageCreateButton } from "@/components/admin/TopImageCreateButton";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { filenameFromImageUrl } from "@/lib/media/photo-name";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function mapRows(data: Record<string, unknown>[] | null): AdminTopImageTableItem[] {
  return (data ?? [])
    .filter((row) => row.is_deleted !== true)
    .map((row) => {
      const slug = String(row.slug ?? "");
      const image_url = (row.image_url as string | null) ?? null;
      const filename = image_url ? filenameFromImageUrl(image_url) : slug;
      const location = (row.location as string | null) ?? null;
      const yearRaw = row.captured_year;
      const captured_year =
        typeof yearRaw === "number"
          ? yearRaw
          : yearRaw != null && String(yearRaw).trim() !== ""
            ? Number(yearRaw)
            : null;
      const yearOk =
        captured_year != null && Number.isFinite(captured_year)
          ? captured_year
          : null;
      const sort_order = Number(row.sort_order ?? 0) || 0;
      const status = String(row.status ?? "published");

      return {
        slug,
        filename,
        image_url,
        location,
        captured_year: yearOk,
        sort_order,
        status,
        editor: {
          slug,
          filename,
          image_url: image_url ?? "",
          alt: String(row.alt ?? "Random Image"),
          location: location ?? "",
          captured_year: yearOk != null ? String(yearOk) : "",
          sort_order: String(sort_order),
          status: status === "draft" ? "draft" : "published",
        },
      };
    });
}

export default async function AdminTopImagesPage() {
  await getSessionUser();

  let items: AdminTopImageTableItem[] = [];
  let loadError: string | null = null;

  if (!hasSupabaseConfig()) {
    loadError = "Supabase が設定されていません（.env.local を確認してください）";
  } else {
    const { data, error } = await getSupabaseAdmin()
      .from("top_image")
      .select("*")
      .eq("is_deleted", false)
      .order("sort_order", { ascending: true })
      .limit(200);

    if (error) {
      loadError = error.message;
      console.error("[admin/top-images]", error.message);
    } else {
      items = mapRows((data ?? []) as Record<string, unknown>[]);
    }
  }

  return (
    <AdminContent width="wide">
      <AdminPageHeader
        title="Top images"
        actions={<TopImageCreateButton />}
      />

      {loadError ? (
        <Alert variant="destructive" className="mb-4">
          読み込みエラー: {loadError}
        </Alert>
      ) : null}

      <Card className="overflow-hidden">
        <CardContent className="overflow-x-auto p-0">
          <AdminTopImageListTable
            items={items}
            empty={!items.length && !loadError}
          />
        </CardContent>
      </Card>
    </AdminContent>
  );
}
