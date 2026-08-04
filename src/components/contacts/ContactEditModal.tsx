"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminContentModal } from "@/components/admin/AdminContentModal";
import { ContactDetailForm } from "@/components/contacts/ContactDetailForm";
import {
  contactDisplayName,
  type WorkspaceActivity,
  type WorkspaceContactDetail,
} from "@/types/contacts";

const FORM_ID = "contact-edit-form";

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
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !contactId) {
      setContact(null);
      setActivities([]);
      setDirty(false);
      setBusy(false);
      setDeleting(false);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
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
    if (!contact || busy || deleting) return;
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

  return (
    <AdminContentModal
      open={open}
      onClose={onClose}
      title={
        contact
          ? contactDisplayName(contact)
          : loading
            ? "読み込み中…"
            : "コンタクト"
      }
      formId={FORM_ID}
      isEdit
      saving={busy}
      dirty={dirty && Boolean(contact)}
      deleting={deleting}
      deleteError={error}
      onDelete={contact ? () => void onDelete() : undefined}
      updateLabel="保存"
      maxWidthClassName="max-w-3xl"
      maxHeightClassName="max-h-[min(90vh,52rem)]"
    >
      <span className="sr-only" id={titleId}>
        コンタクト編集
      </span>
      {loading ? (
        <p className="m-0 text-sm text-muted-foreground">読み込み中…</p>
      ) : contact ? (
        <ContactDetailForm
          contact={contact}
          activities={activities}
          variant="modal"
          formId={FORM_ID}
          onDirtyChange={setDirty}
          onBusyChange={setBusy}
          onSaved={() => {
            onClose();
            router.refresh();
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
