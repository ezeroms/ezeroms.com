import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { NotesEditorForm } from "@/components/admin/NotesEditorForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function AdminNotesNewPage() {
  return (
    <AdminContent>
      <AdminPageHeader
        title="Notes を書く"
        description="タイムラインに載る短いメモを投稿します。"
      />
      <Card>
        <CardHeader>
          <CardTitle>新規 Notes</CardTitle>
          <CardDescription>Markdown が使えます。</CardDescription>
        </CardHeader>
        <CardContent>
          <NotesEditorForm />
        </CardContent>
      </Card>
    </AdminContent>
  );
}
