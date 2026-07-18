import Link from "next/link";
import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { adminNavSections } from "@/lib/admin/nav";
import { getSessionUser } from "@/lib/supabase/auth";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await getSessionUser();
  const sections = adminNavSections.filter((s) => s.id !== "overview");

  return (
    <AdminContent width="wide">
      <AdminPageHeader
        title="ダッシュボード"
        description={
          user?.email
            ? `${user.email} でログイン中。コンテンツ種別ごとに編集できます。`
            : "ログイン情報を取得できませんでした。"
        }
        actions={
          <Button asChild>
            <Link href="/admin/notes/new/">Notes を書く</Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-8">
        {sections.map((section) => (
          <section key={section.id}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.label}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {section.items.map((item) => (
                <Card
                  key={item.href}
                  className={cn(
                    item.status === "soon" && "opacity-80",
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{item.label}</CardTitle>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
                          item.status === "ready"
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {item.status === "ready" ? "Ready" : "Soon"}
                      </span>
                    </div>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      asChild
                      variant={item.status === "ready" ? "default" : "outline"}
                      size="sm"
                    >
                      <Link href={item.href}>
                        {item.status === "ready" ? "開く" : "予定を見る"}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AdminContent>
  );
}
