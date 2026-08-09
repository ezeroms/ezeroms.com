"use client";

import { ActivitiesListTable } from "@/components/contacts/ActivitiesListTable";
import { ContactModalInfoView } from "@/components/contacts/ContactModalInfoView";
import type {
  WorkspaceActivity,
  WorkspaceContactDetail,
} from "@/types/contacts";

export type ContactModalTab = "activity" | "info";

type Props = {
  contact: WorkspaceContactDetail;
  activities: WorkspaceActivity[];
  modalTab: ContactModalTab;
  deleting?: boolean;
  onDelete: () => void;
  onContactUpdated: (contact: WorkspaceContactDetail) => void;
  onActivityUpdated?: (activity: WorkspaceActivity) => void;
};

/**
 * コンタクト編集モーダルの本体。
 * ヘッダーのタブ切替に応じて、アクティビティ一覧か情報パネルを出す。
 */
export function ContactModalBody({
  contact,
  activities,
  modalTab,
  deleting = false,
  onDelete,
  onContactUpdated,
  onActivityUpdated,
}: Props) {
  if (modalTab === "activity") {
    return (
      <section
        role="tabpanel"
        aria-labelledby="contact-modal-tab-activity"
        className="flex flex-col gap-3"
      >
        <div className="overflow-hidden rounded-md border border-solid border-border">
          <div className="overflow-x-auto">
            <ActivitiesListTable
              items={activities.map((activity) => ({
                activity,
                contactNames: [],
              }))}
              showContacts={false}
              detailColumn="what"
              emptyMessage="まだ一緒にした Activity がありません"
              onActivityUpdated={onActivityUpdated}
            />
          </div>
        </div>
      </section>
    );
  }

  return (
    <ContactModalInfoView
      contact={contact}
      deleting={deleting}
      onContactUpdated={onContactUpdated}
      onDelete={onDelete}
    />
  );
}
