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
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminNotesListPage() {
  await getSessionUser();

  let items: {
    slug: string;
    date: string;
    status: string;
    diary_tag: string[] | null;
    body_html: string;
  }[] = [];

  if (hasSupabaseConfig()) {
    const { data } = await getSupabaseAdmin()
      .from("diary")
      .select("slug, date, status, diary_tag, body_html")
      .order("date", { ascending: false })
      .limit(40);
    items = (data ?? []) as typeof items;
  }

  return (
    <>
      <AdminPageHeader
        title="Notes"
        description="日記・メモのタイムライン"
        actions={
          <Button asChild>
            <Link href="/admin/notes/new/">＋ 新規投稿</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>最近の Notes</CardTitle>
          <CardDescription>最新 40 件 · 行をクリックして編集</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="m-0 flex list-none flex-col gap-0 p-0">
            {items.map((item) => {
              const excerpt = item.body_html
                .replace(/<[^>]+>/g, " ")
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 80);
              return (
                <li
                  key={item.slug}
                  className="flex items-center justify-between gap-3 border-b border-border py-3 text-sm last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/notes/${item.slug}/edit/`}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {new Date(item.date).toLocaleString("ja-JP")}
                    </Link>
                    {excerpt ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {excerpt}
                      </p>
                    ) : null}
                    <p className="truncate text-xs text-muted-foreground">
                      {item.status}
                      {(item.diary_tag ?? []).length
                        ? ` · ${(item.diary_tag ?? []).join(", ")}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/notes/${item.slug}/edit/`}>編集</Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/diary/${item.slug}/`}>表示</Link>
                    </Button>
                  </div>
                </li>
              );
            })}
            {!items.length ? (
              <li className="py-6 text-sm text-muted-foreground">
                まだ投稿がありません
              </li>
            ) : null}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
