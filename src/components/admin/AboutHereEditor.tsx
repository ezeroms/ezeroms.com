"use client";

import {
  AboutMarkdownPageEditor,
  type AboutMarkdownPageInitial,
} from "@/components/admin/AboutMarkdownPageEditor";

export type AboutHereEditorInitial = AboutMarkdownPageInitial;

export function AboutHereEditor({
  initial,
}: {
  initial: AboutHereEditorInitial | null;
}) {
  return (
    <AboutMarkdownPageEditor
      initial={initial}
      apiPath="/api/admin/about/here/"
      defaultTitle="このサイトについて"
      successMessage="Here を保存しました"
      bodyPlaceholder="このサイトについての本文…"
      uploadFolder="about-here"
      fieldIdPrefix="here"
    />
  );
}
