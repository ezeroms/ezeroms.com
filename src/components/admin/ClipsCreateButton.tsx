"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ClipsEditModal } from "@/components/admin/ClipsEditModal";

export function ClipsCreateButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        ＋ 新規クリップ
      </Button>
      <ClipsEditModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
