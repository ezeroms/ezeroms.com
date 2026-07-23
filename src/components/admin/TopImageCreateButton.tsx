"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TopImageEditModal } from "@/components/admin/TopImageEditModal";

export function TopImageCreateButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        ＋ コンテンツを追加
      </Button>
      <TopImageEditModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
