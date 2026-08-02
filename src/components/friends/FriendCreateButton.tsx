"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FriendCreateModal } from "@/components/friends/FriendCreateModal";

export function FriendCreateButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        ＋ 友達を追加
      </Button>
      <FriendCreateModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
