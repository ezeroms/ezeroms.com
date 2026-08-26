"use client";

import { AdminCreateButton } from "@/components/admin/AdminCreateButton";
import { GiantsEditModal } from "@/components/admin/GiantsEditModal";

export function GiantsCreateButton() {
  return (
    <AdminCreateButton>
      {({ open, onClose }) => (
        <GiantsEditModal open={open} onClose={onClose} />
      )}
    </AdminCreateButton>
  );
}
