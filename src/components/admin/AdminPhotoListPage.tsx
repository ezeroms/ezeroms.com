import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getPhotoGallery,
  type PhotoGalleryId,
} from "@/lib/content/photo-galleries";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

export async function AdminPhotoListPage({
  galleryId,
}: {
  galleryId: PhotoGalleryId;
}) {
  await getSessionUser();
  const g = getPhotoGallery(galleryId);

  let items: {
    slug: string;
    title: string;
    date: string;
    status: string;
    image_url: string | null;
    location: string | null;
  }[] = [];

  if (hasSupabaseConfig()) {
    const { data } = await getSupabaseAdmin()
      .from(galleryId)
      .select("slug, title, date, status, image_url, location")
      .order("date", { ascending: false })
      .limit(80);
    items = (data ?? []) as typeof items;
  }

  return (
    <>
      <AdminPageHeader
        title={g.label}
        description={g.description}
        actions={
          <Button asChild>
            <Link href={`${g.adminPath}new/`}>＋ 写真を追加</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>最近の {g.label}</CardTitle>
          <CardDescription>最新 80 件</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="m-0 flex list-none flex-col gap-0 p-0">
            {items.map((item) => (
              <li
                key={item.slug}
                className="flex items-center justify-between gap-3 border-b border-border py-3 text-sm last:border-b-0"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image_url}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] text-muted-foreground">
                      —
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`${g.adminPath}${item.slug}/edit/`}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {item.title}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {new Date(item.date).toLocaleDateString("ja-JP")}
                      {item.location ? ` · ${item.location}` : ""} ·{" "}
                      {item.status}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`${g.adminPath}${item.slug}/edit/`}>編集</Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`${g.basePath}${item.slug}/`} target="_blank">
                      見る
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
            {!items.length ? (
              <li className="py-6 text-sm text-muted-foreground">
                まだ写真がありません
              </li>
            ) : null}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
