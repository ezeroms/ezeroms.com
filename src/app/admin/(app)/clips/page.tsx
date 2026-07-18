import Link from "next/link";
import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { clipSourceHost } from "@/lib/content/clip-meta";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminClipsListPage() {
  await getSessionUser();

  let items: {
    slug: string;
    title: string;
    source_url: string;
    date: string;
    status: string;
    memo: string;
  }[] = [];

  if (hasSupabaseConfig()) {
    const { data } = await getSupabaseAdmin()
      .from("clip")
      .select("slug, title, source_url, date, status, memo")
      .order("date", { ascending: false })
      .limit(80);
    items = (data ?? []) as typeof items;
  }

  return (
    <AdminContent width="wide">
      <AdminPageHeader
        title="Clips"
        description="Web記事のクリップ・短いメモ付きブックマーク"
        actions={
          <Button asChild>
            <Link href="/admin/clips/new/">＋ 新規クリップ</Link>
          </Button>
        }
      />
      <Card>
        <CardContent>
          <ul className="m-0 flex list-none flex-col gap-0 p-0">
            {items.map((item) => (
              <li
                key={item.slug}
                className="flex items-center justify-between gap-3 border-b border-border py-3 text-sm last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/clips/${item.slug}/edit/`}
                    className="font-medium underline-offset-2 hover:underline"
                  >
                    {item.title}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">
                    {new Date(item.date).toLocaleDateString("ja-JP")} ·{" "}
                    {clipSourceHost(item.source_url)} · {item.status}
                  </p>
                  {item.memo ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {item.memo}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/clips/${item.slug}/edit/`}>編集</Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      出典
                    </a>
                  </Button>
                </div>
              </li>
            ))}
            {!items.length ? (
              <li className="py-6 text-sm text-muted-foreground">
                まだクリップがありません
              </li>
            ) : null}
          </ul>
        </CardContent>
      </Card>
    </AdminContent>
  );
}
