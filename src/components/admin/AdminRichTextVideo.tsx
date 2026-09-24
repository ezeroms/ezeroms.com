"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";

function AdminRichTextVideoView({ node }: ReactNodeViewProps) {
  const src = node.attrs.src ?? "";
  return (
    <NodeViewWrapper className="my-3" data-drag-handle>
      <video
        src={src}
        controls
        playsInline
        preload="metadata"
        className="max-h-80 w-full rounded-md bg-black"
      />
    </NodeViewWrapper>
  );
}

export const EditorVideo = Node.create({
  name: "video",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: "video[src]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "video",
      mergeAttributes(HTMLAttributes, {
        controls: "true",
        playsinline: "true",
        preload: "metadata",
      }),
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(AdminRichTextVideoView);
  },
});
