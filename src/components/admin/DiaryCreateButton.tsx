"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DiaryEditModal } from "@/components/admin/DiaryEditModal";

export function DiaryCreateButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        ＋ コンテンツを追加
      </Button>
      <DiaryEditModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
