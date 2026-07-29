"use client";

import {
  AboutMarkdownPageEditor,
  type AboutMarkdownPageInitial,
} from "@/components/admin/AboutMarkdownPageEditor";

export type AboutContactEditorInitial = AboutMarkdownPageInitial;

export function AboutContactEditor({
  initial,
}: {
  initial: AboutContactEditorInitial | null;
}) {
  return (
    <AboutMarkdownPageEditor
      initial={initial}
      apiPath="/api/admin/about/contact/"
      defaultTitle="Contact"
      successMessage="Contact を保存しました"
      bodyPlaceholder="お問い合わせについての本文…"
      uploadFolder="about-contact"
      fieldIdPrefix="contact"
    />
  );
}
