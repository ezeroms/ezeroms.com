"use client";

import { useState } from "react";
import { ContactCreateModal } from "@/components/contacts/ContactCreateModal";
import { Button } from "@/components/ui/button";

type Props = {
  defaultIsFriend?: boolean;
  label?: string;
};

export function ContactCreateButton({
  defaultIsFriend = false,
  label = "＋ コンタクトを追加",
}: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <ContactCreateModal
        open={open}
        onClose={() => setOpen(false)}
        defaultIsFriend={defaultIsFriend}
      />
    </>
  );
}
