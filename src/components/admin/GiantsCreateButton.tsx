"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GiantsEditModal } from "@/components/admin/GiantsEditModal";

export function GiantsCreateButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        ＋ コンテンツを追加
      </Button>
      <GiantsEditModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
