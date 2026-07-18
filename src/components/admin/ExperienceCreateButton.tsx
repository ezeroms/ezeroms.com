"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExperienceEditModal } from "@/components/admin/ExperienceEditModal";

export function ExperienceCreateButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        ＋ コンテンツを追加
      </Button>
      <ExperienceEditModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
