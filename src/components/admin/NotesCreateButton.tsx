"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NotesEditModal } from "@/components/admin/NotesEditModal";

export function NotesCreateButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        ＋ コンテンツを追加
      </Button>
      <NotesEditModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
