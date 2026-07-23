"use client";

import { useEffect, useRef } from "react";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import nginx from "highlight.js/lib/languages/nginx";
import shell from "highlight.js/lib/languages/shell";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";
import "highlight.js/styles/atom-one-dark.css";
import { cn } from "@/lib/cn";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sh", bash);
hljs.registerLanguage("shell", shell);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("nginx", nginx);
hljs.registerLanguage("css", css);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("yml", yaml);

const LANG_LABELS: Record<string, string> = {
  bash: "Bash",
  sh: "Shell",
  shell: "Shell",
  javascript: "JavaScript",
  js: "JavaScript",
  typescript: "TypeScript",
  ts: "TypeScript",
  json: "JSON",
  nginx: "nginx",
  css: "CSS",
  html: "HTML",
  xml: "XML",
  yaml: "YAML",
  yml: "YAML",
  plaintext: "Text",
  text: "Text",
};

function languageLabel(lang: string | undefined): string {
  if (!lang) return "Code";
  return LANG_LABELS[lang.toLowerCase()] ?? lang;
}

/** Lucide `Copy` / `Check` 相当の SVG（DOM 生成用） */
const ICON_COPY = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;

const ICON_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`;

function readLanguage(code: HTMLElement): string | undefined {
  const fromClass = [...code.classList]
    .find((c) => c.startsWith("language-"))
    ?.replace(/^language-/, "");
  return fromClass || undefined;
}

function enhanceCodeBlocks(root: HTMLElement) {
  const codes = root.querySelectorAll<HTMLElement>("pre > code");
  codes.forEach((code) => {
    const pre = code.parentElement;
    if (!pre || pre.closest(".code-block")) return;

    const raw = code.textContent ?? "";
    let lang = readLanguage(code);

    try {
      if (lang && hljs.getLanguage(lang)) {
        const result = hljs.highlight(raw, { language: lang, ignoreIllegals: true });
        code.innerHTML = result.value;
      } else {
        const result = hljs.highlightAuto(raw, [
          "bash",
          "nginx",
          "javascript",
          "typescript",
          "json",
          "css",
          "html",
          "yaml",
        ]);
        code.innerHTML = result.value;
        lang = result.language || lang;
      }
    } catch {
      /* keep plain text */
    }

    code.classList.add("hljs");
    if (lang) {
      code.classList.add(`language-${lang}`);
    }

    const wrapper = document.createElement("div");
    wrapper.className = "code-block";

    const header = document.createElement("div");
    header.className = "code-block__header";

    const label = document.createElement("span");
    label.className = "code-block__lang";
    label.textContent = languageLabel(lang);

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "code-block__copy";
    copyBtn.innerHTML = ICON_COPY;
    copyBtn.setAttribute("aria-label", "コードをコピー");
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(raw);
        copyBtn.innerHTML = ICON_CHECK;
        copyBtn.setAttribute("aria-label", "コピーしました");
        window.setTimeout(() => {
          copyBtn.innerHTML = ICON_COPY;
          copyBtn.setAttribute("aria-label", "コードをコピー");
        }, 1600);
      } catch {
        copyBtn.innerHTML = ICON_COPY;
        copyBtn.setAttribute("aria-label", "コピーに失敗しました");
        window.setTimeout(() => {
          copyBtn.setAttribute("aria-label", "コードをコピー");
        }, 1600);
      }
    });

    header.appendChild(label);
    header.appendChild(copyBtn);

    pre.replaceWith(wrapper);
    wrapper.appendChild(header);
    wrapper.appendChild(pre);
    pre.classList.add("code-block__pre");
  });
}

type Props = {
  html: string;
  className?: string;
};

/**
 * 記事本文 HTML。コードブロックに構文ハイライト・言語ラベル・コピーを付与する。
 */
export function ArticleProse({ html, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    enhanceCodeBlocks(el);
  }, [html]);

  return (
    <div
      ref={ref}
      className={cn(className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
