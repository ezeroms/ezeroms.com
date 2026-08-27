import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { WorkspaceConfigNotice } from "@/components/admin/WorkspaceConfigNotice";
import { ContactCreateButton } from "@/components/contacts/ContactCreateButton";
import {
  ContactsListTable,
  type ContactsTableItem,
} from "@/components/contacts/ContactsListTable";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { findAdminNavItem } from "@/lib/admin/nav";
import { requireAdminPage } from "@/lib/supabase/auth";
import { listLastActivityByContactIds } from "@/lib/workspace/activities";
import { listContacts } from "@/lib/workspace/contacts";
import { hasWorkspaceConfig } from "@/lib/workspace/db/server";
import { compareContactsByKana } from "@/types/contacts";

export const dynamic = "force-dynamic";

const navItem = findAdminNavItem("/admin/workspace/friends/")!;

export default async function AdminWorkspaceFriendsPage() {
  await requireAdminPage();

  let loadError: string | null = null;
  let items: ContactsTableItem[] = [];

  if (hasWorkspaceConfig()) {
    try {
      const contacts = await listContacts({ limit: 500, isFriend: true });
      contacts.sort(compareContactsByKana);
      const lastMap = await listLastActivityByContactIds(
        contacts.map((c) => c.id),
      );
      items = contacts.map((contact) => {
        const last = lastMap.get(contact.id);
        return {
          contact,
          lastActivityAt: last?.occurredAt ?? null,
          lastActivityTitle: last?.title ?? null,
        };
      });
    } catch (e) {
      loadError = e instanceof Error ? e.message : "読み込みに失敗しました";
    }
  }

  return (
    <AdminContent width="wide">
      <AdminPageHeader
        title={navItem.label}
        actions={
          hasWorkspaceConfig() ? (
            <ContactCreateButton
              defaultIsFriend
              label="＋ 友達を追加"
            />
          ) : null
        }
      />
      <WorkspaceConfigNotice />
      {loadError ? (
        <Alert variant="destructive" className="mb-4">
          {loadError}
        </Alert>
      ) : null}
      {hasWorkspaceConfig() && !loadError ? (
        <Card className="overflow-hidden">
          <CardContent className="overflow-x-auto p-0">
            <ContactsListTable
              items={items}
              emptyMessage="まだ友達がいません"
            />
          </CardContent>
        </Card>
      ) : null}
    </AdminContent>
  );
}
