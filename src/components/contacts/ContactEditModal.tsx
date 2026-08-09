"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminContentModal } from "@/components/admin/AdminContentModal";
import {
  ContactModalBody,
  type ContactModalTab,
} from "@/components/contacts/ContactModalBody";
import {
  contactDisplayName,
  currentEmployment,
  type WorkspaceActivity,
  type WorkspaceContactDetail,
} from "@/types/contacts";

const TABS: { id: ContactModalTab; label: string }[] = [
  { id: "activity", label: "アクティビティログ" },
  { id: "info", label: "情報" },
];

type Props = {
  open: boolean;
  contactId: string | null;
  onClose: () => void;
};

export function ContactEditModal({ open, contactId, onClose }: Props) {
  const router = useRouter();
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contact, setContact] = useState<WorkspaceContactDetail | null>(null);
  const [activities, setActivities] = useState<WorkspaceActivity[]>([]);
  const [modalTab, setModalTab] = useState<ContactModalTab>("activity");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !contactId) {
      setContact(null);
      setActivities([]);
      setModalTab("activity");
      setDeleting(false);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setModalTab("activity");
    void (async () => {
      try {
        const res = await fetch(`/api/admin/workspace/contacts/${contactId}/`);
        const data = (await res.json()) as {
          item?: WorkspaceContactDetail;
          activities?: WorkspaceActivity[];
          error?: string;
        };
        if (!res.ok) throw new Error(data.error || "読み込みに失敗しました");
        if (cancelled) return;
        setContact(data.item ?? null);
        setActivities(data.activities ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "読み込みに失敗しました");
          setContact(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, contactId]);

  async function onDelete() {
    if (!contact || deleting) return;
    if (!confirm(`${contactDisplayName(contact)} を削除しますか？`)) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/workspace/contacts/${contact.id}/`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "削除に失敗しました");
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
      setDeleting(false);
    }
  }

  if (!mounted) return null;

  const displayTitle = contact
    ? contactDisplayName(contact)
    : loading
      ? "読み込み中…"
      : "コンタクト";

  const workplace = contact
    ? (
        currentEmployment(contact.employments) ??
        contact.employments[0] ??
        null
      )?.company_name.trim() || null
    : null;

  return (
    <AdminContentModal
      open={open}
      onClose={onClose}
      title={displayTitle}
      isEdit
      saving={false}
      dirty={false}
      showSave={false}
      deleting={deleting}
      deleteError={error}
      cancelLabel="閉じる"
      maxWidthClassName="max-w-3xl"
      maxHeightClassName="h-[calc(100vh-2rem)] sm:h-[calc(100vh-3rem)]"
      header={
        contact ? (
          <div className="flex flex-col">
            <div className="flex flex-col gap-2 px-6 pb-4 pt-5">
              <h2
                id={titleId}
                className="m-0 text-2xl font-semibold tracking-tight text-foreground"
              >
                {contactDisplayName(contact)}
              </h2>
              {workplace ? (
                <p className="m-0 text-sm text-muted-foreground">{workplace}</p>
              ) : null}
            </div>
            <div
              role="tablist"
              aria-label="コンタクト詳細"
              className="admin-underline-tabs"
            >
              {TABS.map((tab) => {
                const selected = modalTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    id={`contact-modal-tab-${tab.id}`}
                    onClick={() => setModalTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : undefined
      }
    >
      {loading ? (
        <p className="m-0 text-sm text-muted-foreground">読み込み中…</p>
      ) : contact ? (
        <ContactModalBody
          contact={contact}
          activities={activities}
          modalTab={modalTab}
          deleting={deleting}
          onDelete={() => void onDelete()}
          onContactUpdated={setContact}
          onActivityUpdated={(updated) => {
            setActivities((prev) =>
              prev.map((activity) =>
                activity.id === updated.id ? updated : activity,
              ),
            );
          }}
        />
      ) : (
        <p className="m-0 text-sm text-red-600" role="alert">
          {error || "コンタクトが見つかりません"}
        </p>
      )}
    </AdminContentModal>
  );
}
