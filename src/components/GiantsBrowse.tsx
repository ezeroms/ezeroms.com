"use client";

import { useEffect, useRef } from "react";
import type { ShouldersOfGiants } from "@/types/content";
import { GiantsQuoteCard } from "@/components/GiantsQuoteCard";
import { GiantsTagNav } from "@/components/GiantsTagNav";

type Props = {
  items: ShouldersOfGiants[];
  tags?: string[];
  /** 単一選択。空なら全件。並びはサーバー側でシャッフル済み */
  selectedTag?: string | null;
};

type ScrollSnapshot = {
  listTop: number;
  mainTop: number;
};

/** popstate（戻る／進む）直後だけ true。モジュール横断でマウントをまたぐ。 */
let giantsNavWasPop = false;

function scrollStorageKey(tag: string | null): string {
  return `giants:list-scroll:${tag ?? ""}`;
}

function readSnapshot(tag: string | null): ScrollSnapshot | null {
  try {
    const raw = sessionStorage.getItem(scrollStorageKey(tag));
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

function writeSnapshot(tag: string | null, snapshot: ScrollSnapshot) {
  try {
    sessionStorage.setItem(scrollStorageKey(tag), JSON.stringify(snapshot));
  } catch {
    // ignore quota / private mode
  }
}

/**
 * Giants 一覧。PC は SiteShell 右レール、スマホは右下 FAB。
 */
export function GiantsBrowse({
  items,
  tags = [],
  selectedTag = null,
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

  // 現在タグのスクロール位置を記憶（離脱・切替の cleanup でも保存）
  useEffect(() => {
    const list = listRef.current;
    const main = document.getElementById("main-content");

    function save() {
      writeSnapshot(selectedTag, {
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
  }, [selectedTag]);

  // リンク遷移 → 先頭／ブラウザバック・フォワード → 記憶位置へ
  useEffect(() => {
    const list = listRef.current;
    const main = document.getElementById("main-content");
    const wasPop = giantsNavWasPop;
    giantsNavWasPop = false;

    if (wasPop) {
      const saved = readSnapshot(selectedTag);
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
  }, [selectedTag]);

  return (
    <>
      <GiantsTagNav tags={tags} selectedTag={selectedTag} />
      <div id="notification" className="notification">
        リンクをコピーしました
      </div>

      <div ref={listRef} className="w-full font-sans" id="giants-list">
        {!items.length ? (
          <p className="py-10 text-sm text-muted-foreground">
            {selectedTag
              ? "このタグのメモはまだありません。"
              : "まだメモがありません。"}
          </p>
        ) : (
          <div className="mx-auto flex w-full max-w-2xl flex-col">
            {items.map((item, index) => (
              <div key={item.id}>
                {index > 0 ? (
                  <div className="h-px bg-border-subtle" aria-hidden />
                ) : null}
                <GiantsQuoteCard
                  item={item}
                  selectedTag={selectedTag}
                  className="py-8"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
