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
import { getSessionUser } from "@/lib/supabase/auth";
import {
  listContacts,
  listCurrentEmploymentsByContactIds,
} from "@/lib/workspace/contacts";
import { hasWorkspaceConfig } from "@/lib/workspace/db/server";
import {
  compareContactsByKana,
  formatEmploymentLabel,
} from "@/types/contacts";

export const dynamic = "force-dynamic";

const navItem = findAdminNavItem("/admin/workspace/contacts/")!;

export default async function AdminWorkspaceContactsPage() {
  await getSessionUser();

  let loadError: string | null = null;
  let items: ContactsTableItem[] = [];

  if (hasWorkspaceConfig()) {
    try {
      const contacts = await listContacts({ limit: 500 });
      contacts.sort(compareContactsByKana);
      const employmentMap = await listCurrentEmploymentsByContactIds(
        contacts.map((c) => c.id),
      );
      items = contacts.map((contact) => {
        const employment = employmentMap.get(contact.id);
        return {
          contact,
          lastActivityAt: null,
          lastActivityTitle: null,
          currentCompany: employment
            ? formatEmploymentLabel(employment)
            : null,
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
        actions={hasWorkspaceConfig() ? <ContactCreateButton /> : null}
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
              showCompany
              showTags
              showBirthday={false}
              showLastActivity={false}
            />
          </CardContent>
        </Card>
      ) : null}
    </AdminContent>
  );
}
