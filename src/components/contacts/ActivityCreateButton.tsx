"use client";

import { useState } from "react";
import { ActivityCreateModal } from "@/components/contacts/ActivityCreateModal";
import { Button } from "@/components/ui/button";
import type { WorkspaceContact } from "@/types/contacts";

type Props = {
  contacts: WorkspaceContact[];
};

export function ActivityCreateButton({ contacts }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        ＋ Activity を追加
      </Button>
      <ActivityCreateModal
        open={open}
        onClose={() => setOpen(false)}
        contacts={contacts}
      />
    </>
  );
}
