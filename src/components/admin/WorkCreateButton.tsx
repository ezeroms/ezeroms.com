"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { WorkEditModal } from "@/components/admin/WorkEditModal";

export function WorkCreateButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        ＋ コンテンツを追加
      </Button>
      <WorkEditModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
