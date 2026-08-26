"use client";

import { AdminCreateButton } from "@/components/admin/AdminCreateButton";
import { ExperienceEditModal } from "@/components/admin/ExperienceEditModal";

export function ExperienceCreateButton() {
  return (
    <AdminCreateButton>
      {({ open, onClose }) => (
        <ExperienceEditModal open={open} onClose={onClose} />
      )}
    </AdminCreateButton>
  );
}
