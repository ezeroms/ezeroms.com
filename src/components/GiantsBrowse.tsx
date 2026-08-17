"use client";

import { useEffect, useRef } from "react";
import type { ShouldersOfGiants } from "@/types/content";
import { cn } from "@/lib/cn";
import { GiantsQuoteCard } from "@/components/GiantsQuoteCard";
import { GiantsTopicNav } from "@/components/GiantsTopicNav";

type Props = {
  topics: string[];
  items: ShouldersOfGiants[];
  /** 単一選択。空なら全件。並びはサーバー側でシャッフル済み */
  selectedTopic?: string | null;
};

type ScrollSnapshot = {
  listTop: number;
  mainTop: number;
};

/** popstate（戻る／進む）直後だけ true。モジュール横断でマウントをまたぐ。 */
let giantsNavWasPop = false;

function scrollStorageKey(topic: string | null): string {
  return `giants:list-scroll:${topic ?? ""}`;
}

function readSnapshot(topic: string | null): ScrollSnapshot | null {
  try {
    const raw = sessionStorage.getItem(scrollStorageKey(topic));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ScrollSnapshot>;
    return {
      listTop: Number(parsed.listTop) || 0,
      mainTop: Number(parsed.mainTop) || 0,
    };
  } catch {
    return null;
  }
}

function writeSnapshot(topic: string | null, snapshot: ScrollSnapshot) {
  try {
    sessionStorage.setItem(scrollStorageKey(topic), JSON.stringify(snapshot));
  } catch {
    // quota / private mode
  }
}

/**
 * 左: 50音順トピックナビ
 * 右: Notes と同型の引用カード
 * PC（≥1080）は左右を独立スクロール。
 */
export function GiantsBrowse({
  topics,
  items,
  selectedTopic = null,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  // 戻る／進むを検知（Next のソフトナビでも popstate が飛ぶ）
  useEffect(() => {
    function onPopState() {
      giantsNavWasPop = true;
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // 現在トピックのスクロール位置を記憶（離脱・切替の cleanup でも保存）
  useEffect(() => {
    const list = listRef.current;
    const main = document.getElementById("main-content");

    function save() {
      writeSnapshot(selectedTopic, {
        listTop: list?.scrollTop ?? 0,
        mainTop: main?.scrollTop ?? 0,
      });
    }

    list?.addEventListener("scroll", save, { passive: true });
    main?.addEventListener("scroll", save, { passive: true });
    return () => {
      save();
      list?.removeEventListener("scroll", save);
      main?.removeEventListener("scroll", save);
    };
  }, [selectedTopic]);

  // リンク遷移 → 先頭／ブラウザバック・フォワード → 記憶位置へ
  useEffect(() => {
    const list = listRef.current;
    const main = document.getElementById("main-content");
    const wasPop = giantsNavWasPop;
    giantsNavWasPop = false;

    if (wasPop) {
      const saved = readSnapshot(selectedTopic);
      const restore = () => {
        list?.scrollTo({ top: saved?.listTop ?? 0, left: 0 });
        main?.scrollTo({ top: saved?.mainTop ?? 0, left: 0 });
      };
      restore();
      // カード描画後に高さが変わることがあるのでもう一度
      requestAnimationFrame(restore);
      return;
    }

    list?.scrollTo({ top: 0, left: 0 });
    main?.scrollTo({ top: 0, left: 0 });
    window.scrollTo({ top: 0, left: 0 });
  }, [selectedTopic]);

  return (
    <>
      <div id="notification" className="notification">
        リンクをコピーしました
      </div>

      <div
        className={cn(
          "flex w-full flex-col gap-6",
          "min-[1080px]:min-h-0 min-[1080px]:flex-1 min-[1080px]:flex-row min-[1080px]:gap-8 min-[1080px]:overflow-hidden",
        )}
      >
        <GiantsTopicNav topics={topics} selectedTopic={selectedTopic} />

        <div
          ref={listRef}
          className={cn(
            "min-w-0 flex-1 font-sans",
            "min-[1080px]:min-h-0 min-[1080px]:overflow-y-auto",
          )}
          id="giants-list"
        >
          {!items.length ? (
            <p className="py-10 text-sm text-muted-foreground">
              {selectedTopic
                ? "このトピックのメモはまだありません。"
                : "まだメモがありません。"}
            </p>
          ) : (
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-20 min-[1080px]:pb-6">
              {items.map((item) => (
                <GiantsQuoteCard
                  key={item.id}
                  item={item}
                  selectedTopic={selectedTopic}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
