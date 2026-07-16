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
import type { AdminNavItem } from "@/lib/admin/nav";

export function AdminComingSoon({ item }: { item: AdminNavItem }) {
  return (
    <>
      <AdminPageHeader title={item.label} description={item.description} />
      <Card>
        <CardHeader>
          <CardTitle>準備中</CardTitle>
          <CardDescription>
            このセクションの編集 UI はこれから実装します。データモデルと公開 API
            は既にあります。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/">ダッシュボードへ</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/notes/new/">代わりに Notes を書く</Link>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
