"use client";

import { AdminCreateButton } from "@/components/admin/AdminCreateButton";
import { WorkEditModal } from "@/components/admin/WorkEditModal";

type Props = {
  /** Chooning など、新規作成時に付与する product_key */
  productKey?: string | null;
};

export function WorkCreateButton({ productKey = null }: Props) {
  return (
    <AdminCreateButton>
      {({ open, onClose }) => (
        <WorkEditModal
          open={open}
          onClose={onClose}
          productKey={productKey}
        />
      )}
    </AdminCreateButton>
  );
}
