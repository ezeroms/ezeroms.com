import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DiaryEditorForm } from "@/components/admin/DiaryEditorForm";

export const dynamic = "force-dynamic";

export default function AdminDiaryNewPage() {
  return (
    <AdminContent>
      <AdminPageHeader
        title="Diary を書く"
        description="タイムラインに載る日記を投稿します。"
      />
      <DiaryEditorForm />
    </AdminContent>
  );
}
