import { AdminSection } from "@/components/admin/AdminSection";

const DEFAULT_MESSAGE =
  "このセクションの編集 UI はこれから実装します。公開／非公開は上の「編集」から設定できます。";

export function AdminComingSoon({
  message = DEFAULT_MESSAGE,
  children,
}: {
  message?: string;
  children?: React.ReactNode;
}) {
  return (
    <AdminSection title="準備中" description={message}>
      {children}
    </AdminSection>
  );
}
