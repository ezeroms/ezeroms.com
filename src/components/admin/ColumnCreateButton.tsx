"use client";

import { AdminCreateButton } from "@/components/admin/AdminCreateButton";
import { ColumnEditModal } from "@/components/admin/ColumnEditModal";

export function ColumnCreateButton() {
  return (
    <AdminCreateButton>
      {({ open, onClose }) => (
        <ColumnEditModal open={open} onClose={onClose} />
      )}
    </AdminCreateButton>
  );
}
