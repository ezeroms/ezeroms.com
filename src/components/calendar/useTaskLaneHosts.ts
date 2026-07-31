"use client";

import { useEffect, useState } from "react";

export type TaskLaneHost = {
  dateKey: string;
  host: HTMLElement;
  hostId: string;
};

/** ポータルキー再利用を防ぐための通し番号（リマウント跨ぎでも単調増加）。 */
let hostSequence = 0;

/**
 * schedule-x の日列ごとに Task レーン用ホスト要素を差し込む。
 * グリッドは schedule-x が描画するため、再描画のたびホストを作り直す。
 */
export function useTaskLaneHosts(
  rootRef: React.RefObject<HTMLDivElement | null>,
): TaskLaneHost[] {
  const [hosts, setHosts] = useState<TaskLaneHost[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const syncHosts = () => {
      const next: TaskLaneHost[] = [];
      for (const day of root.querySelectorAll<HTMLElement>(
        "[data-time-grid-date]",
      )) {
        const dateKey = day.dataset.timeGridDate;
        if (!dateKey) continue;

        let host = day.querySelector<HTMLElement>(
          ":scope > .sx-task-lane-host",
        );
        if (!host) {
          host = document.createElement("div");
          host.className = "sx-task-lane-host";
          // React はポータルの移動に弱いので、新しいホストには新しいキーを付ける
          host.dataset.laneHostId = String(++hostSequence);
          day.appendChild(host);
        }
        next.push({
          dateKey,
          host,
          hostId: host.dataset.laneHostId ?? dateKey,
        });
      }

      setHosts((previous) =>
        previous.length === next.length &&
        previous.every(
          (item, index) =>
            item.host === next[index].host &&
            item.dateKey === next[index].dateKey,
        )
          ? previous
          : next,
      );
    };

    syncHosts();
    const observer = new MutationObserver(syncHosts);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [rootRef]);

  return hosts;
}
