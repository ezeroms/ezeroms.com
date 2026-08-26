"use client";

import { AdminCreateButton } from "@/components/admin/AdminCreateButton";
import { ClipsEditModal } from "@/components/admin/ClipsEditModal";

export function ClipsCreateButton() {
  return (
    <AdminCreateButton label="＋ 新規クリップ">
      {({ open, onClose }) => <ClipsEditModal open={open} onClose={onClose} />}
    </AdminCreateButton>
  );
}
