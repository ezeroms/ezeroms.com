"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  editorHtmlToMarkdown,
  markdownToEditorHtml,
} from "@/lib/admin/rich-text";

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
  const uploadRef = useRef(onUploadImage);
  uploadRef.current = onUploadImage;
  const editorRef = useRef<Editor | null>(null);

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
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: {
          class: "underline underline-offset-2",
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: "max-h-80 w-auto rounded-md",
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: markdownToEditorHtml(value),
    editable: !disabled,
    editorProps: {
      attributes: {
        id: id ?? "",
        class: cn(
          "prose prose-sm max-w-none px-3 py-2 text-sm leading-relaxed text-foreground outline-none",
          "[&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_blockquote]:my-2",
          "[&_h1]:mb-2 [&_h1]:mt-3 [&_h1]:text-lg [&_h1]:font-semibold",
          "[&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold",
          "[&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-sm [&_h3]:font-semibold",
          "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
          "[&_hr]:my-4 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-border",
          "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em]",
          "[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs",
          "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
          "[&_img]:my-3 [&_img]:max-h-80 [&_img]:w-auto [&_img]:rounded-md",
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
      onChange(editorHtmlToMarkdown(ed.getHTML()));
    },
  });

  editorRef.current = editor;

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled && !uploadingImage);
  }, [disabled, editor, uploadingImage]);

  // External value changes only (e.g. after save/refresh); avoid fighting while typing.
  useEffect(() => {
    if (!editor || editor.isFocused) return;
    const current = editorHtmlToMarkdown(editor.getHTML());
    if (current === value.trim()) return;
    editor.commands.setContent(markdownToEditorHtml(value), {
      emitUpdate: false,
    });
  }, [editor, value]);

  function setLink() {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const next = window.prompt("リンク URL", previous || "https://");
    if (next === null) return;
    const href = next.trim();
    if (!href) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
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
        "admin-rich-text flex h-auto w-full flex-col items-stretch gap-0 overflow-hidden p-0 text-sm text-foreground shadow-none transition-colors",
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
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-1 py-1">
        <ToolbarButton
          label="太字"
          disabled={toolbarDisabled}
          active={editor?.isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="斜体"
          disabled={toolbarDisabled}
          active={editor?.isActive("italic")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="打ち消し"
          disabled={toolbarDisabled}
          active={editor?.isActive("strike")}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="リンク"
          disabled={toolbarDisabled}
          active={editor?.isActive("link")}
          onClick={setLink}
        >
          <Link2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="インラインコード"
          disabled={toolbarDisabled}
          active={editor?.isActive("code")}
          onClick={() => editor?.chain().focus().toggleCode().run()}
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="コードブロック"
          disabled={toolbarDisabled}
          active={editor?.isActive("codeBlock")}
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
          active={editor?.isActive("heading", { level: 1 })}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="見出し 2"
          disabled={toolbarDisabled}
          active={editor?.isActive("heading", { level: 2 })}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="見出し 3"
          disabled={toolbarDisabled}
          active={editor?.isActive("heading", { level: 3 })}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="箇条書き"
          disabled={toolbarDisabled}
          active={editor?.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="番号付きリスト"
          disabled={toolbarDisabled}
          active={editor?.isActive("orderedList")}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="引用"
          disabled={toolbarDisabled}
          active={editor?.isActive("blockquote")}
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
      <EditorContent editor={editor} />
      {uploadingImage ? (
        <p className="m-0 border-t border-border px-3 py-1.5 text-xs text-muted-foreground">
          画像をアップロード中…
        </p>
      ) : null}
    </div>
  );
}
