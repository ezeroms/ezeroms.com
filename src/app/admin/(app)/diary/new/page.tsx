import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DiaryEditorForm } from "@/components/admin/DiaryEditorForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function AdminDiaryNewPage() {
  return (
    <AdminContent>
      <AdminPageHeader
        title="Diary を書く"
        description="タイムラインに載る日記を投稿します。"
      />
      <Card>
        <CardHeader>
          <CardTitle>新規 Diary</CardTitle>
          <CardDescription>Markdown が使えます。</CardDescription>
        </CardHeader>
        <CardContent>
          <DiaryEditorForm />
        </CardContent>
      </Card>
    </AdminContent>
  );
}
