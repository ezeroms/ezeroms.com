"use client";

import { AdminCreateButton } from "@/components/admin/AdminCreateButton";
import { TopImageEditModal } from "@/components/admin/TopImageEditModal";

export function TopImageCreateButton() {
  return (
    <AdminCreateButton>
      {({ open, onClose }) => (
        <TopImageEditModal open={open} onClose={onClose} />
      )}
    </AdminCreateButton>
  );
}
