"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  friendDisplayName,
  formatActivityTags,
  type WorkspaceActivity,
  type WorkspaceFriend,
} from "@/types/friends";

type Props = {
  activity: WorkspaceActivity;
  friends: WorkspaceFriend[];
  allFriends: WorkspaceFriend[];
  calendarLink: {
    google_calendar_id: string;
    google_event_id: string;
  } | null;
};

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function ActivityDetailForm({
  activity,
  friends: initialFriends,
  allFriends,
  calendarLink,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(activity.title);
  const [occurredAt, setOccurredAt] = useState(
    toLocalInput(activity.occurred_at),
  );
  const [endedAt, setEndedAt] = useState(toLocalInput(activity.ended_at));
  const [whatMd, setWhatMd] = useState(activity.what_md ?? "");
  const [notesMd, setNotesMd] = useState(activity.notes_md ?? "");
  const [location, setLocation] = useState(activity.location ?? "");
  const [tags, setTags] = useState(formatActivityTags(activity.tags));
  const [friendIds, setFriendIds] = useState(
    () => new Set(initialFriends.filter((f) => !f.deleted_at).map((f) => f.id)),
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const friendOptions = useMemo(
    () =>
      allFriends.map((f) => ({
        id: f.id,
        label: friendDisplayName(f),
      })),
    [allFriends],
  );

  function toggleFriend(id: string) {
    setFriendIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/workspace/activities/${activity.id}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            occurred_at: fromLocalInput(occurredAt),
            ended_at: fromLocalInput(endedAt),
            what_md: whatMd,
            notes_md: notesMd,
            location: location.trim() || null,
            tags,
          }),
        },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "保存に失敗しました");

      const friendsRes = await fetch(
        `/api/admin/workspace/activities/${activity.id}/friends/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ friend_ids: [...friendIds] }),
        },
      );
      const friendsData = (await friendsRes.json()) as { error?: string };
      if (!friendsRes.ok) {
        throw new Error(friendsData.error || "友達の保存に失敗しました");
      }

      setMessage("保存しました");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (busy) return;
    if (!confirm(`「${activity.title}」を削除しますか？`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/workspace/activities/${activity.id}/`,
        { method: "DELETE" },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "削除に失敗しました");
      router.push("/admin/workspace/activities/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSave} className="flex flex-col gap-4">
      {activity.title_source === "calendar" ? (
        <p className="m-0 text-xs text-muted-foreground">
          タイトルはカレンダーから作成されました。ここで変更しても Google
          カレンダーには反映されません。
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="activity-title">タイトル</Label>
        <Input
          id="activity-title"
          value={title}
          disabled={busy}
          required
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="activity-start">開始</Label>
          <Input
            id="activity-start"
            type="datetime-local"
            value={occurredAt}
            disabled={busy}
            onChange={(e) => setOccurredAt(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="activity-end">終了</Label>
          <Input
            id="activity-end"
            type="datetime-local"
            value={endedAt}
            disabled={busy}
            onChange={(e) => setEndedAt(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="activity-location">場所</Label>
        <Input
          id="activity-location"
          value={location}
          disabled={busy}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="activity-tags">タグ（カンマ区切り）</Label>
        <Input
          id="activity-tags"
          value={tags}
          disabled={busy}
          placeholder="飲み, 旅行"
          onChange={(e) => setTags(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="activity-what">何をしたか</Label>
        <Textarea
          id="activity-what"
          value={whatMd}
          disabled={busy}
          className="min-h-[100px]"
          onChange={(e) => setWhatMd(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="activity-notes">どんな話をしたかなど</Label>
        <Textarea
          id="activity-notes"
          value={notesMd}
          disabled={busy}
          className="min-h-[120px]"
          onChange={(e) => setNotesMd(e.target.value)}
        />
      </div>

      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-1 text-sm font-medium">一緒にいた友達</legend>
        {friendOptions.length === 0 ? (
          <p className="m-0 text-sm text-muted-foreground">
            まだ友達がいません。{" "}
            <Link
              href="/admin/workspace/friends/"
              className="underline-offset-2 hover:underline"
            >
              Friends
            </Link>{" "}
            で追加してください。
          </p>
        ) : (
          <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
            {friendOptions.map((f) => (
              <li key={f.id}>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={friendIds.has(f.id)}
                    disabled={busy}
                    onChange={() => toggleFriend(f.id)}
                  />
                  {f.label}
                </label>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      {calendarLink ? (
        <p className="m-0 text-xs text-muted-foreground">
          Googleカレンダーに紐づいています（
          {calendarLink.google_calendar_id} / {calendarLink.google_event_id}
          ）。タイトルやメモの変更はカレンダーには書き戻しません。
        </p>
      ) : (
        <p className="m-0 text-xs text-muted-foreground">
          カレンダー未リンク。カレンダーの予定詳細から友達を付けると自動で紐づきます。
        </p>
      )}

      {error ? (
        <p className="m-0 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="m-0 text-sm text-muted-foreground">{message}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy || !title.trim()}>
          保存
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={busy}
          onClick={() => void onDelete()}
        >
          削除
        </Button>
        <Button type="button" variant="ghost" asChild>
          <Link href="/admin/workspace/activities/">一覧へ</Link>
        </Button>
      </div>
    </form>
  );
}
