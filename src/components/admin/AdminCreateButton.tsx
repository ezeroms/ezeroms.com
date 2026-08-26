"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  label?: string;
  children: (ctrl: { open: boolean; onClose: () => void }) => ReactNode;
};

/** 管理一覧ヘッダーの「＋ 追加」→ 編集モーダルを開く。 */
export function AdminCreateButton({
  label = "＋ コンテンツを追加",
  children,
}: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        {label}
      </Button>
      {children({ open, onClose: () => setOpen(false) })}
    </>
  );
}
