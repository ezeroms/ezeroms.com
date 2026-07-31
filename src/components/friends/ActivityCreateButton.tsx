"use client";

import { useState } from "react";
import { ActivityCreateModal } from "@/components/friends/ActivityCreateModal";
import { Button } from "@/components/ui/button";
import type { WorkspaceFriend } from "@/types/friends";

type Props = {
  friends: WorkspaceFriend[];
};

export function ActivityCreateButton({ friends }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        ＋ Activity を追加
      </Button>
      <ActivityCreateModal
        open={open}
        onClose={() => setOpen(false)}
        friends={friends}
      />
    </>
  );
}
