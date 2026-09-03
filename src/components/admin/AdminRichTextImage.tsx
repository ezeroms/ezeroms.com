"use client";

import Image from "@tiptap/extension-image";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { ignorePasswordManagersProps } from "@/lib/admin/password-managers";
import { cn } from "@/lib/cn";

function AdminRichTextImageView({
  node,
  updateAttributes,
  selected,
}: ReactNodeViewProps) {
  const title = (node.attrs.title as string | null | undefined) ?? "";
  const src = (node.attrs.src as string | null | undefined) ?? "";
  const alt = (node.attrs.alt as string | null | undefined) ?? "";

  return (
    <NodeViewWrapper
      as="figure"
      className={cn(
        "rt-figure mx-auto my-3 flex w-fit max-w-full flex-col items-center",
        selected && "rounded-md",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        data-drag-handle
        className="my-0 max-h-80 w-auto rounded-md"
      />
      <input
        type="text"
        value={title}
        placeholder="注釈（任意）"
        aria-label="画像の注釈"
        className={cn(
          "mt-1.5 w-full min-w-[10rem] border-0 bg-transparent px-1 py-0.5 text-center text-xs leading-relaxed text-muted-foreground shadow-none outline-none",
          "placeholder:text-muted-foreground/45",
          "focus-visible:rounded-sm focus-visible:ring-1 focus-visible:ring-border",
        )}
        onChange={(e) => updateAttributes({ title: e.target.value })}
        onBlur={(e) => {
          const next = e.target.value.trim();
          updateAttributes({ title: next || null });
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") {
            e.preventDefault();
            (e.currentTarget as HTMLInputElement).blur();
          }
        }}
        onMouseDown={(e) => e.stopPropagation()}
        {...ignorePasswordManagersProps}
      />
    </NodeViewWrapper>
  );
}

/**
 * ブロック画像。title を注釈として保持し、エディタ下に入力欄を出す。
 * 保存 HTML は通常の `<img title>`（公開側で figure 化する）。
 */
export const EditorImage = Image.extend({
  atom: true,
  parseHTML() {
    return [
      {
        tag: "figure",
        getAttrs(node) {
          if (!(node instanceof HTMLElement)) return false;
          const img = node.querySelector("img");
          if (!img) return false;
          const src = img.getAttribute("src");
          if (!src) return false;
          const caption = (
            img.getAttribute("title") ||
            node.querySelector("figcaption")?.textContent ||
            ""
          ).trim();
          return {
            src,
            alt: img.getAttribute("alt"),
            title: caption || null,
            width: img.getAttribute("width"),
            height: img.getAttribute("height"),
          };
        },
      },
      ...(this.parent?.() ?? []),
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(AdminRichTextImageView, {
      stopEvent({ event }) {
        const target = event.target;
        return (
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement
        );
      },
    });
  },
});
