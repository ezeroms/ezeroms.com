"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { FormEvent, useEffect, useId, useMemo, useState } from "react";
import { AdminContentModal } from "@/components/admin/AdminContentModal";
import { AdminRichTextEditor } from "@/components/admin/AdminRichTextEditor";
import { ContactMultiPicker } from "@/components/contacts/ContactMultiPicker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GoogleCalendarEvent } from "@/types/calendar";
import {
  googleDescriptionToMarkdown,
  markdownToGoogleDescription,
} from "@/lib/admin/rich-text";
import {
  datetimeLocalToIso,
  isoToDatetimeLocal,
} from "@/lib/workspace/calendar/time";
import {
  contactDisplayName,
  type CalendarActivityLink,
  type WorkspaceContact,
} from "@/types/contacts";

export type CalendarEventAnchor = {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

export type CalendarEventEditValues = {
  summary: string;
  start: string;
  end: string;
  allDay: boolean;
  description: string;
  location: string;
};

type Props = {
  open: boolean;
  event: GoogleCalendarEvent;
  timeZone: string;
  canWrite: boolean;
  initialActivityLink?: CalendarActivityLink | null;
  onClose: () => void;
  onSave: (values: CalendarEventEditValues) => Promise<void>;
  onActivityLinkChange?: (link: CalendarActivityLink | null) => void;
};

type FormState = {
  summary: string;
  start: string;
  end: string;
  description: string;
  location: string;
};

/** Google の終日 end は排他的なので、フォーム表示用に1日戻す。 */
function inclusiveAllDayEnd(exclusiveEnd: string): string {
  try {
    return Temporal.PlainDate.from(exclusiveEnd)
      .subtract({ days: 1 })
      .toString();
  } catch {
    return exclusiveEnd;
  }
}

function formFromEvent(
  event: GoogleCalendarEvent,
  timeZone: string,
): FormState {
  const shared = {
    summary: event.summary,
    description: googleDescriptionToMarkdown(event.description ?? ""),
    location: event.location ?? "",
  };
  if (event.allDay) {
    return {
      ...shared,
      start: event.start.slice(0, 10),
      end: inclusiveAllDayEnd(event.end.slice(0, 10)),
    };
  }
  return {
    ...shared,
    start: isoToDatetimeLocal(event.start, timeZone),
    end: isoToDatetimeLocal(event.end, timeZone),
  };
}

export function CalendarEventPopover({
  open,
  event,
  timeZone,
  canWrite,
  initialActivityLink = null,
  onClose,
  onSave,
  onActivityLinkChange,
}: Props) {
  const formId = useId();
  const editable = canWrite && !event.readOnly;
  const [baseline] = useState(() => formFromEvent(event, timeZone));
  const [form, setForm] = useState<FormState>(() =>
    formFromEvent(event, timeZone),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [contacts, setContacts] = useState<WorkspaceContact[]>([]);
  const [contactIds, setContactIds] = useState<Set<string>>(
    () => new Set(initialActivityLink?.contactIds ?? []),
  );
  const [activityId, setActivityId] = useState<string | null>(
    initialActivityLink?.activityId ?? null,
  );
  const [contactsLoaded, setContactsLoaded] = useState(false);
  const [contactsDirty, setContactsDirty] = useState(false);
  const [contactsBusy, setContactsBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/admin/workspace/contacts/?limit=500");
        const data = (await res.json()) as {
          items?: WorkspaceContact[];
        };
        if (!cancelled && res.ok) {
          setContacts(data.items ?? []);
        }
      } finally {
        if (!cancelled) setContactsLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(baseline),
    [form, baseline],
  );

  function patchForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setContactSelection(next: Set<string>) {
    setContactIds(next);
    setContactsDirty(true);
  }

  async function saveContacts() {
    setContactsBusy(true);
    setError(null);
    try {
      const res = await fetch(
        "/api/admin/workspace/activities/from-calendar/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            google_calendar_id: event.calendarId,
            google_event_id: event.id,
            summary: form.summary.trim() || event.summary,
            start: event.start,
            end: event.end,
            location: form.location.trim() || event.location,
            contact_ids: [...contactIds],
          }),
        },
      );
      const data = (await res.json()) as {
        item?: {
          id: string;
          title: string;
          contacts?: WorkspaceContact[];
        };
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "コンタクトの保存に失敗しました");
      const item = data.item;
      if (item) {
        setActivityId(item.id);
        const activeContacts = (item.contacts ?? []).filter((c) => !c.deleted_at);
        const link: CalendarActivityLink = {
          googleCalendarId: event.calendarId,
          googleEventId: event.id,
          activityId: item.id,
          activityTitle: item.title,
          contactIds: activeContacts.map((c) => c.id),
          contactNames: activeContacts.map(contactDisplayName),
        };
        setContactIds(new Set(link.contactIds));
        onActivityLinkChange?.(link);
      }
      setContactsDirty(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "コンタクトの保存に失敗しました",
      );
      throw err;
    } finally {
      setContactsBusy(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (saving || contactsBusy) return;
    setError(null);
    setSaving(true);
    const hadEventDirty = editable && dirty;
    const hadContactsDirty = contactsDirty;
    try {
      // Contacts first — Google save closes the modal via onSave.
      if (hadContactsDirty) {
        await saveContacts();
      }
      if (hadEventDirty) {
        let nextStart = form.start;
        let nextEnd = form.end;
        if (event.allDay) {
          nextEnd = Temporal.PlainDate.from(form.end)
            .add({ days: 1 })
            .toString();
        } else {
          nextStart = datetimeLocalToIso(form.start, timeZone);
          nextEnd = datetimeLocalToIso(form.end, timeZone);
        }
        await onSave({
          summary: form.summary.trim(),
          start: nextStart,
          end: nextEnd,
          allDay: event.allDay,
          description: markdownToGoogleDescription(form.description),
          location: form.location.trim(),
        });
      } else {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "予定の保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  const canSubmit =
    (editable && dirty && Boolean(form.summary.trim())) || contactsDirty;

  return (
    <AdminContentModal
      open={open}
      onClose={onClose}
      title={event.summary ? `予定: ${event.summary}` : "予定"}
      formId={formId}
      isEdit
      saving={saving || contactsBusy}
      dirty={canSubmit}
      deleteError={error}
      updateLabel="保存"
      maxWidthClassName="max-w-2xl"
      maxHeightClassName="max-h-[min(90vh,44rem)]"
    >
      <form id={formId} onSubmit={submit} className="flex flex-col gap-4">
        <p className="m-0 text-xs text-muted-foreground">
          {event.calendarSummary}
          {event.allDay ? " · 終日" : ""}
        </p>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cal-event-title">タイトル</Label>
          <Input
            id="cal-event-title"
            value={form.summary}
            disabled={!editable || saving}
            required
            onChange={(e) => patchForm("summary", e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cal-event-start">開始</Label>
            <Input
              id="cal-event-start"
              type={event.allDay ? "date" : "datetime-local"}
              value={form.start}
              disabled={!editable || saving}
              required
              onChange={(e) => patchForm("start", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cal-event-end">終了</Label>
            <Input
              id="cal-event-end"
              type={event.allDay ? "date" : "datetime-local"}
              value={form.end}
              disabled={!editable || saving}
              required
              onChange={(e) => patchForm("end", e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cal-event-location">場所</Label>
          <Input
            id="cal-event-location"
            value={form.location}
            disabled={!editable || saving}
            placeholder="場所を追加"
            onChange={(e) => patchForm("location", e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cal-event-description">詳細</Label>
          <AdminRichTextEditor
            id="cal-event-description"
            value={form.description}
            onChange={(markdown) => patchForm("description", markdown)}
            disabled={!editable || saving}
            placeholder="詳細を追加"
            minHeightClassName="min-h-[120px]"
          />
        </div>

        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="mb-1 text-sm font-medium">一緒にいた人</legend>
          <ContactMultiPicker
            contacts={contacts}
            selectedIds={contactIds}
            onChange={setContactSelection}
            disabled={saving || contactsBusy}
            loading={!contactsLoaded}
          />
          {activityId ? (
            <p className="m-0 text-xs">
              <Link
                href={`/admin/workspace/activities/${activityId}/`}
                className="underline-offset-2 hover:underline"
              >
                Activity を開く
              </Link>
            </p>
          ) : null}
        </fieldset>

        {!editable ? (
          <p className="m-0 text-xs text-muted-foreground">
            この予定は読み取り専用です（友達の紐づけは可能）。
          </p>
        ) : null}

        {event.htmlLink ? (
          <p className="m-0 text-xs text-muted-foreground">
            <a
              href={event.htmlLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 underline-offset-2 hover:underline"
            >
              Googleカレンダーで開く
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </p>
        ) : null}
      </form>
    </AdminContentModal>
  );
}
