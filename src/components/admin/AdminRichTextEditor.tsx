"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  SquareCode,
  Strikethrough,
} from "lucide-react";
import { AdminRichTextLinkModal } from "@/components/admin/AdminRichTextLinkModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  editorHtmlToMarkdown,
  markdownToEditorHtml,
} from "@/lib/admin/rich-text";

/**
 * TipTap ドキュメント上で、画像の直前の空段落だけ削除する。
 * （直後の空段落はカーソル置き場として残す）
 */
function pruneEmptyParagraphsBeforeImages(editor: Editor): number {
  const ranges: { from: number; to: number }[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name !== "paragraph" || node.content.size > 0) return;
    const $pos = editor.state.doc.resolve(pos);
    const index = $pos.index($pos.depth);
    const parent = $pos.node($pos.depth);
    const next =
      index < parent.childCount - 1 ? parent.child(index + 1) : null;
    if (next?.type.name === "image") {
      ranges.push({ from: pos, to: pos + node.nodeSize });
    }
  });
  if (!ranges.length) return 0;
  let { tr } = editor.state;
  for (let i = ranges.length - 1; i >= 0; i--) {
    const range = ranges[i]!;
    tr = tr.delete(range.from, range.to);
  }
  editor.view.dispatch(tr);
  return ranges.length;
}

/** autolink は維持しつつ、マーク終端で isActive が残り続けないようにする */
const EditorLink = Link.extend({
  inclusive() {
    return false;
  },
});

type Props = {
  id?: string;
  value: string;
  onChange: (markdown: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  minHeightClassName?: string;
  /** 指定時にツールバー／ペースト／ドロップで本文画像を挿入できる */
  onUploadImage?: (file: File) => Promise<string | null>;
};

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "h-8 w-8 shrink-0",
        active && "bg-accent text-accent-foreground",
      )}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

type ToolbarState = {
  isBold: boolean;
  isItalic: boolean;
  isStrike: boolean;
  isLink: boolean;
  isCode: boolean;
  isCodeBlock: boolean;
  isH1: boolean;
  isH2: boolean;
  isH3: boolean;
  isBulletList: boolean;
  isOrderedList: boolean;
  isBlockquote: boolean;
  linkHref: string;
};

const emptyToolbar: ToolbarState = {
  isBold: false,
  isItalic: false,
  isStrike: false,
  isLink: false,
  isCode: false,
  isCodeBlock: false,
  isH1: false,
  isH2: false,
  isH3: false,
  isBulletList: false,
  isOrderedList: false,
  isBlockquote: false,
  linkHref: "",
};

function readToolbarState(editor: Editor | null): ToolbarState {
  if (!editor) return emptyToolbar;
  return {
    isBold: editor.isActive("bold"),
    isItalic: editor.isActive("italic"),
    isStrike: editor.isActive("strike"),
    isLink: editor.isActive("link"),
    isCode: editor.isActive("code"),
    isCodeBlock: editor.isActive("codeBlock"),
    isH1: editor.isActive("heading", { level: 1 }),
    isH2: editor.isActive("heading", { level: 2 }),
    isH3: editor.isActive("heading", { level: 3 }),
    isBulletList: editor.isActive("bulletList"),
    isOrderedList: editor.isActive("orderedList"),
    isBlockquote: editor.isActive("blockquote"),
    linkHref: (editor.getAttributes("link").href as string | undefined) ?? "",
  };
}

export function AdminRichTextEditor({
  id,
  value,
  onChange,
  disabled = false,
  placeholder = "紹介文を入力…",
  className,
  minHeightClassName = "min-h-[180px]",
  onUploadImage,
}: Props) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkModalHref, setLinkModalHref] = useState("");
  const uploadRef = useRef(onUploadImage);
  uploadRef.current = onUploadImage;
  const editorRef = useRef<Editor | null>(null);
  /** setContent 後の prune で onChange が走り外部 value と戦うのを防ぐ */
  const suppressOnChangeRef = useRef(false);

  async function insertUploadedImages(files: File[]) {
    const upload = uploadRef.current;
    const ed = editorRef.current;
    if (!upload || !ed || !files.length) return;
    setUploadingImage(true);
    try {
      for (const file of files) {
        const url = await upload(file);
        if (!url) continue;
        ed.chain().focus().setImage({ src: url }).run();
      }
      pruneEmptyParagraphsBeforeImages(ed);
    } finally {
      setUploadingImage(false);
    }
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        // StarterKit 同梱の Link と二重登録しない
        link: false,
      }),
      EditorLink.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: {
          // 色は親の [&_a] で制御。下線は付けない
          class: null,
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: "max-h-80 w-auto rounded-md",
        },
      }),
      Placeholder.configure({
        placeholder,
        // カーソル位置以外の空行にも is-empty を付け、余白調整 CSS を効かせる
        showOnlyCurrent: false,
      }),
    ],
    content: markdownToEditorHtml(value),
    editable: !disabled,
    editorProps: {
      attributes: {
        id: id ?? "",
        class: cn(
          "prose prose-sm max-w-none px-3 py-2 text-sm leading-relaxed text-foreground outline-none",
          // 公開側 notesBody と同じく隣接段落マージン方式（空行の二重余白を避ける）
          "[&_p]:m-0 [&_p+p]:mt-2 [&_ul]:my-2 [&_ol]:my-2 [&_blockquote]:my-2",
          "[&_h1]:mb-2 [&_h1]:mt-3 [&_h1]:text-lg [&_h1]:font-semibold",
          "[&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold",
          "[&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-sm [&_h3]:font-semibold",
          "[&_blockquote]:mx-0 [&_blockquote]:border-0 [&_blockquote]:border-l-[3px] [&_blockquote]:border-solid [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
          "[&_hr]:my-4 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-border",
          "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em]",
          "[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs",
          "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
          "[&_img]:my-3 [&_img]:max-h-80 [&_img]:w-auto [&_img]:rounded-md",
          // ブログ本文と同じ muted 色。下線なし（admin-root a の inherit を打ち消す）
          "[&_a]:!text-muted-foreground [&_a]:!no-underline hover:[&_a]:!text-foreground",
          "[&_p.is-editor-empty:first-child::before]:pointer-events-none [&_p.is-editor-empty:first-child::before]:float-left [&_p.is-editor-empty:first-child::before]:h-0 [&_p.is-editor-empty:first-child::before]:text-muted-foreground [&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
          minHeightClassName,
        ),
      },
      handlePaste(_view, event) {
        if (!uploadRef.current || !event.clipboardData) return false;
        const files = Array.from(event.clipboardData.files).filter((f) =>
          f.type.startsWith("image/"),
        );
        if (!files.length) return false;
        event.preventDefault();
        void insertUploadedImages(files);
        return true;
      },
      handleDrop(_view, event) {
        if (!uploadRef.current || !event.dataTransfer) return false;
        const files = Array.from(event.dataTransfer.files).filter((f) =>
          f.type.startsWith("image/"),
        );
        if (!files.length) return false;
        event.preventDefault();
        void insertUploadedImages(files);
        return true;
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (suppressOnChangeRef.current) return;
      onChange(editorHtmlToMarkdown(ed.getHTML()));
    },
  });

  editorRef.current = editor;

  const toolbar = useEditorState({
    editor,
    selector: ({ editor: ed }) => readToolbarState(ed),
  }) ?? emptyToolbar;

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled && !uploadingImage);
  }, [disabled, editor, uploadingImage]);

  useEffect(() => {
    if (!editor) return;
    suppressOnChangeRef.current = true;
    pruneEmptyParagraphsBeforeImages(editor);
    suppressOnChangeRef.current = false;
  }, [editor]);

  // External value changes only (e.g. after save/refresh); avoid fighting while typing.
  useEffect(() => {
    if (!editor || editor.isFocused) return;
    const current = editorHtmlToMarkdown(editor.getHTML());
    if (current === value.trim()) return;
    editor.commands.setContent(markdownToEditorHtml(value), {
      emitUpdate: false,
    });
    // setContent 後も TipTap が画像前に空段落を差し込むことがある
    suppressOnChangeRef.current = true;
    pruneEmptyParagraphsBeforeImages(editor);
    suppressOnChangeRef.current = false;
  }, [editor, value]);

  function openLinkModal() {
    if (!editor) return;
    setLinkModalHref(toolbar.linkHref);
    setLinkModalOpen(true);
  }

  function applyLink(href: string) {
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    setLinkModalOpen(false);
  }

  function removeLink() {
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setLinkModalOpen(false);
  }

  function toggleCodeBlock() {
    if (!editor) return;
    if (editor.isActive("codeBlock")) {
      editor.chain().focus().toggleCodeBlock().run();
      return;
    }
    const current =
      (editor.getAttributes("codeBlock").language as string | undefined) ?? "";
    const raw = window.prompt(
      "コードの言語（任意: nginx / bash / js / ts / json …）",
      current,
    );
    if (raw === null) return;
    const language = raw.trim().toLowerCase();
    editor
      .chain()
      .focus()
      .toggleCodeBlock(language ? { language } : undefined)
      .run();
  }

  const toolbarDisabled = disabled || !editor || uploadingImage;

  return (
    <div
      className={cn(
        "admin-rich-text flex h-auto max-h-[min(32rem,55vh)] w-full flex-col items-stretch gap-0 overflow-hidden p-0 text-sm text-foreground shadow-none transition-colors",
        (disabled || uploadingImage) && "opacity-50",
        className,
      )}
    >
      {onUploadImage ? (
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*,.heic,.heif,image/heic,image/heif"
          className="sr-only"
          disabled={toolbarDisabled}
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            void insertUploadedImages(files);
          }}
        />
      ) : null}
      <div className="flex shrink-0 flex-wrap items-center gap-0.5 border-b border-border bg-card px-1 py-1">
        <ToolbarButton
          label="太字"
          disabled={toolbarDisabled}
          active={toolbar.isBold}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="斜体"
          disabled={toolbarDisabled}
          active={toolbar.isItalic}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="打ち消し"
          disabled={toolbarDisabled}
          active={toolbar.isStrike}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="リンク"
          disabled={toolbarDisabled}
          active={toolbar.isLink}
          onClick={openLinkModal}
        >
          <Link2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="インラインコード"
          disabled={toolbarDisabled}
          active={toolbar.isCode}
          onClick={() => editor?.chain().focus().toggleCode().run()}
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="コードブロック"
          disabled={toolbarDisabled}
          active={toolbar.isCodeBlock}
          onClick={toggleCodeBlock}
        >
          <SquareCode className="h-4 w-4" />
        </ToolbarButton>
        {onUploadImage ? (
          <ToolbarButton
            label={uploadingImage ? "画像アップロード中" : "画像を挿入"}
            disabled={toolbarDisabled}
            onClick={() => imageInputRef.current?.click()}
          >
            <ImageIcon className="h-4 w-4" />
          </ToolbarButton>
        ) : null}
        <span className="mx-1 h-4 w-px bg-border" aria-hidden />
        <ToolbarButton
          label="見出し 1"
          disabled={toolbarDisabled}
          active={toolbar.isH1}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="見出し 2"
          disabled={toolbarDisabled}
          active={toolbar.isH2}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="見出し 3"
          disabled={toolbarDisabled}
          active={toolbar.isH3}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="箇条書き"
          disabled={toolbarDisabled}
          active={toolbar.isBulletList}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="番号付きリスト"
          disabled={toolbarDisabled}
          active={toolbar.isOrderedList}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="引用"
          disabled={toolbarDisabled}
          active={toolbar.isBlockquote}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="区切り線"
          disabled={toolbarDisabled}
          onClick={() => editor?.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-4 w-4" />
        </ToolbarButton>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <EditorContent editor={editor} />
      </div>
      {uploadingImage ? (
        <p className="m-0 shrink-0 border-t border-border px-3 py-1.5 text-xs text-muted-foreground">
          画像をアップロード中…
        </p>
      ) : null}
      <AdminRichTextLinkModal
        open={linkModalOpen}
        initialHref={linkModalHref}
        onClose={() => setLinkModalOpen(false)}
        onApply={applyLink}
        onRemove={removeLink}
      />
    </div>
  );
}
