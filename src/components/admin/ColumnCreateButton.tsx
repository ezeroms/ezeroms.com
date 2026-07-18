"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ColumnEditModal } from "@/components/admin/ColumnEditModal";

export function ColumnCreateButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        ＋ コンテンツを追加
      </Button>
      <ColumnEditModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
