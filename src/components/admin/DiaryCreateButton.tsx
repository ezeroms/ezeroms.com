"use client";

import { AdminCreateButton } from "@/components/admin/AdminCreateButton";
import { DiaryEditModal } from "@/components/admin/DiaryEditModal";

export function DiaryCreateButton() {
  return (
    <AdminCreateButton>
      {({ open, onClose }) => <DiaryEditModal open={open} onClose={onClose} />}
    </AdminCreateButton>
  );
}
