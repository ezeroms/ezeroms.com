import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Empty / not-yet-implemented admin section shell. */
export function AdminSectionPlaceholder({
  title,
  description,
  message = "この画面はこれから実装します。",
  notice,
}: {
  title: string;
  description?: string;
  message?: string;
  notice?: React.ReactNode;
}) {
  return (
    <AdminContent>
      <AdminPageHeader title={title} description={description} />
      {notice}
      <Card>
        <CardHeader>
          <CardTitle>準備中</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
      </Card>
    </AdminContent>
  );
}
