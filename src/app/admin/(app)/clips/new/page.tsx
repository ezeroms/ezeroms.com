import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ClipsEditorForm } from "@/components/admin/ClipsEditorForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function AdminClipsNewPage() {
  return (
    <>
      <AdminPageHeader
        title="クリップを追加"
        description="タイトル・出典URL・短いメモだけで残せます。"
      />
      <Card>
        <CardHeader>
          <CardTitle>新規 Clips</CardTitle>
          <CardDescription>
            長い意見は Column へ。ここはブックマーク用です。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClipsEditorForm />
        </CardContent>
      </Card>
    </>
  );
}
